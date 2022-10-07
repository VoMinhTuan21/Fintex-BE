import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_POST_SUCCESSFULLY,
    DELETE_COMMENT_SUCCESS,
    DELETE_REACTION_POST_SUCCESSFULLY,
    ERROR_ADD_COMMENT_TO_POST,
    ERROR_CREATE_POST,
    ERROR_DELETE_COMMENT_POST,
    ERROR_DELETE_REACTION_POST,
    ERROR_GET_COMMENT_POST,
    ERROR_GET_FRIEND_POST_ID,
    ERROR_GET_POST_FOR_PAGINATION,
    ERROR_GET_POST_PAGINATION,
    ERROR_GET_STRANGER_POST_IDS,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_POST_HAS_NO_DATA,
    ERROR_REACTION_POST,
    GET_POST_FOR_PAGINATION_SUCCESSFULLY,
    GET_POST_PAGINATION_SUCCESSFULLY,
    REACTION_POST_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image, PostIdWithUser } from '../../types/classes';
import { Orientation } from '../../types/enums/orientation';
import { ICommentsIdPaginate, ICreatePost, IImage, IResPost } from '../../types/post';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FeelingService } from '../feeling/feeling.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
        private readonly userService: UserService,
        private readonly feelingService: FeelingService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async create(userId: string, newPost: ICreatePost, imageFiles: Array<Express.Multer.File>) {
        try {
            const { content, feeling, visibleFor } = newPost;
            if (!content && !feeling && !imageFiles && !visibleFor) {
                return handleResponse({
                    error: ERROR_POST_HAS_NO_DATA,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const images: Image[] = [];
            const newImages: IImage[] = [];

            for (let index = 0; index < imageFiles.length; index++) {
                const file = imageFiles[index];
                const { height, width, public_id, url } = await this.cloudinaryService.uploadImage(file, 'Fintex');
                const image: Image = {
                    publicId: public_id,
                    orientation: height >= width ? Orientation.Vertical : Orientation.Horizontal,
                };

                const imageRes: IImage = {
                    url,
                    orientation: height >= width ? Orientation.Vertical : Orientation.Horizontal,
                };

                newImages.push(imageRes);
                images.push(image);
            }

            const post = await this.postModel.create({
                content,
                feeling,
                images,
                visibleFor,
            });

            const user = await this.userService.addPost(userId, post._id);
            const avatar = await this.cloudinaryService.getImageUrl(user.avatar);
            const feelingDetail = await this.feelingService.findById(feeling);

            const responsePost = {
                _id: post._id,
                userId: user._id,
                avatar,
                name: user.name,
                content: post.content,
                feeling: feelingDetail,
                visibleFor: post.visibleFor,
                images: newImages,
                reactions: [],
                comments: 0,
                createdAt: new Date().toISOString(),
            };
            return handleResponse({
                message: CREATE_POST_SUCCESSFULLY,
                data: responsePost,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async addComment(postId: string, commentId: string) {
        try {
            this.postModel
                .updateOne({ _id: postId }, { $push: { comments: new mongoose.Types.ObjectId(commentId) + '' } })
                .exec();
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: ERROR_ADD_COMMENT_TO_POST,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getComments(postId: string, limit: number, after: string) {
        try {
            const post = await this.postModel.findById(postId);
            const commentIds = post.comments.reverse();
            let index: number;
            if (after) {
                index = commentIds.findIndex((item) => item.toString() === after);
            } else {
                index = 0;
            }

            const result: ICommentsIdPaginate = {
                commentsId: commentIds.slice(index, index + limit) as string[],
                after: index + limit < post.comments.length ? commentIds[index + limit].toString() : '',
                ended: index + limit >= post.comments.length,
            };

            return result;
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: ERROR_GET_COMMENT_POST,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getPostsForPagination(userId: string) {
        try {
            const friendPostIds: PostIdWithUser[] = await this.userService.findFriendsRecentPost(userId);
            if (!friendPostIds) {
                return handleResponse({
                    error: ERROR_GET_FRIEND_POST_ID,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const strangerPostIds: PostIdWithUser[] = await this.userService.findStrangerPostIds(userId);
            if (!strangerPostIds) {
                return handleResponse({
                    error: ERROR_GET_STRANGER_POST_IDS,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const unionPostsWithUser: PostIdWithUser[] = [...friendPostIds, ...strangerPostIds];
            // const unionPostsWithUser: PostIdWithUser[] = [...strangerPostIds];

            const postIds: string[] = [];
            unionPostsWithUser.forEach((item) => {
                item.posts.forEach((id) => postIds.push(id));
            });

            //TODO: populate to get feeling and reaction of post
            const unionPosts: IResPost[] = await this.postModel
                .find(
                    {
                        _id: { $in: postIds },
                    },
                    { updatedAt: 0, __v: 0 },
                )
                .populate('feeling', 'name emoji')
                .populate('reactions.user', 'name');
            if (!unionPosts) {
                return handleResponse({
                    error: ERROR_GET_STRANGER_POST_IDS,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const newUnionPostsWithUser = [];
            for (let i = 0; i < unionPosts.length; i++) {
                const post = unionPosts[i];
                for (let j = 0; j < unionPostsWithUser.length; j++) {
                    const user = unionPostsWithUser[j];
                    const indexPost = user.posts.findIndex((id) => id.toString() === post._id.toString());
                    if (indexPost !== -1) {
                        const newImages: IImage[] = [];
                        for (let index = 0; index < post.images.length; index++) {
                            const img = post.images[index];
                            const url = await this.cloudinaryService.getImageUrl(img.publicId);
                            newImages.push({
                                url,
                                orientation: img.orientation,
                            });
                        }
                        //Todo: count reaction of each types

                        newUnionPostsWithUser.push({
                            userId: user._id,
                            name: user.name,
                            avatar: await this.cloudinaryService.getImageUrl(user.avatar),
                            _id: post._id,
                            content: post.content,
                            feeling: post.feeling,
                            visibleFor: post.visibleFor,
                            images: newImages,
                            createdAt: post.createdAt,
                            comments: post.comments.length,
                            reactions: post.reactions,
                        });
                    }
                }
            }

            // console.log('newUnionPostsWithUser: ', newUnionPostsWithUser);
            return handleResponse({
                message: GET_POST_FOR_PAGINATION_SUCCESSFULLY,
                data: newUnionPostsWithUser,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_POST_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async findPostPagination(userId: string, limit: number, after: string) {
        try {
            // console.log('limit: ', limit);
            const response = await this.getPostsForPagination(userId);
            const posts = response.data;
            // console.log('posts: ', posts);
            // console.log('posts.length: ', posts.length);

            if (after) {
                const indexAfter = posts.findIndex((post) => post._id.toString() === after);
                console.log('indexAfter: ', indexAfter);
                if (indexAfter) {
                    if (indexAfter + limit < posts.length) {
                        return handleResponse({
                            message: GET_POST_PAGINATION_SUCCESSFULLY,
                            data: {
                                posts: posts.slice(indexAfter, indexAfter + limit),
                                after: posts[indexAfter + limit]._id,
                                ended: false,
                            },
                        });
                    } else {
                        return handleResponse({
                            message: GET_POST_PAGINATION_SUCCESSFULLY,
                            data: {
                                posts: posts.slice(indexAfter),
                                after: '',
                                ended: true,
                            },
                        });
                    }
                } else {
                    return handleResponse({
                        message: GET_POST_PAGINATION_SUCCESSFULLY,
                        data: {
                            posts: [],
                            after: '',
                            ended: true,
                        },
                    });
                }
            } else {
                if (posts.length > limit) {
                    return handleResponse({
                        message: GET_POST_PAGINATION_SUCCESSFULLY,
                        data: {
                            posts: posts.slice(0, limit),
                            after: posts[limit]._id,
                            ended: false,
                        },
                    });
                } else {
                    console.log('vo khong');
                    return handleResponse({
                        message: GET_POST_PAGINATION_SUCCESSFULLY,
                        data: {
                            posts: posts,
                            after: '',
                            ended: true,
                        },
                    });
                }
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_POST_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteComment(postId: string, commentId: string, userId: string) {
        try {
            const comment = await this.postModel.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(postId) },
                },
                {
                    $lookup: {
                        from: 'comments',
                        foreignField: '_id',
                        localField: 'comments',
                        as: 'comments',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', new mongoose.Types.ObjectId(commentId)],
                                    },
                                },
                            },
                            {
                                $project: { _id: 0, userId: 1 },
                            },
                        ],
                    },
                },
                {
                    $project: { _id: 0, comments: 1 },
                },
            ]);

            if (userId !== comment[0].comments[0].userId.toString()) {
                return handleResponse({
                    error: ERROR_NOT_HAVE_PERMISSION,
                    statusCode: HttpStatus.UNAUTHORIZED,
                });
            }

            await this.postModel.updateOne(
                { _id: postId },
                {
                    $pull: { comments: commentId },
                },
            );

            return handleResponse({
                message: DELETE_COMMENT_SUCCESS,
                data: commentId,
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_COMMENT_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getAfter(postId: string, commentId: string) {
        const post = await this.postModel.findById(postId);
        const comments = post.comments.reverse();
        const index = comments.findIndex((item: any) => item.toString() === commentId);

        if (index === comments.length - 1) {
            return '';
        }

        return comments[index + 1].toString();
    }

    async reactionPost(userId: string, postId: string, type: string) {
        try {
            const post = await this.postModel.findById(postId);
            const oldReaction = post.reactions.find((item) => item.user.toString() === userId.toString());
            if (oldReaction) {
                oldReaction.type = type;
                oldReaction.user = new mongoose.Types.ObjectId(userId).toString();
            } else {
                post.reactions.push({
                    type,
                    user: new mongoose.Types.ObjectId(userId).toString(),
                });
            }

            await post.save();
            const user = await this.userService.findById(userId);

            return handleResponse({
                message: REACTION_POST_SUCCESSFULLY,
                data: {
                    postId,
                    reaction: {
                        type,
                        user: {
                            _id: user._id,
                            name: user.name,
                        },
                    },
                },
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_REACTION_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteReactionPost(userId: string, postId: string) {
        try {
            await this.postModel.findByIdAndUpdate(postId, {
                $pull: {
                    reactions: { user: new mongoose.Types.ObjectId(userId) },
                },
            });

            return handleResponse({
                message: DELETE_REACTION_POST_SUCCESSFULLY,
                data: {
                    postId,
                    userId,
                },
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_REACTION_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
