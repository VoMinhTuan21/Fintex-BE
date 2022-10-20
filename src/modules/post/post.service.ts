import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_AVATAR_COVER_POST_SUCCESSFULLY,
    CREATE_POST_SUCCESSFULLY,
    DELETE_COMMENT_SUCCESS,
    DELETE_POST_SUCCESSFULLY,
    DELETE_REACTION_POST_SUCCESSFULLY,
    ERROR_ADD_COMMENT_TO_POST,
    ERROR_CREATE_AVATAR_COVER_POST,
    ERROR_CREATE_POST,
    ERROR_DELETE_COMMENT_POST,
    ERROR_DELETE_POST,
    ERROR_DELETE_REACTION_POST,
    ERROR_GET_COMMENT_POST,
    ERROR_GET_FRIEND_POST_ID,
    ERROR_GET_MY_POST_FOR_PAGINATION,
    ERROR_GET_PERSON_POSTS_FOR_PAGINATION,
    ERROR_GET_POST_FOR_PAGINATION,
    ERROR_GET_POST_PAGINATION,
    ERROR_GET_STRANGER_POST_IDS,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_POST_HAS_NO_DATA,
    ERROR_REACTION_POST,
    ERROR_UPDATE_POST,
    GET_MY_POST_FOR_PAGINATION_SUCCESSFULLY,
    GET_PERSON_POST_FOR_PAGINATION_SUCCESSFULLY,
    GET_POST_FOR_PAGINATION_SUCCESSFULLY,
    GET_POST_PAGINATION_SUCCESSFULLY,
    REACTION_POST_SUCCESSFULLY,
    UPDATE_POST_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image, PostIdWithUser } from '../../types/classes';
import { UpdateImage, VisibleFor } from '../../types/enums';
import { Orientation } from '../../types/enums/orientation';
import { ICommentsIdPaginate, ICreatePost, IImage, IResPost, IUpdatePost } from '../../types/post';
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
                postType: 'normal',
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
                typePost: post.postType,
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
                            postType: post.postType,
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

    async findPostPagination(
        userId: string,
        limit: number,
        after: string,
        type: 'all' | 'mine' | 'person',
        personId?: string,
    ) {
        try {
            let response: { data: any; message?: string };
            if (type === 'all') {
                response = await this.getPostsForPagination(userId);
            } else if (type === 'mine') {
                response = await this.getMyPostForPagination(userId);
            } else if (type === 'person') {
                response = await this.getPersonPostForPagination(userId, personId);
            }

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

    async getMyPostForPagination(userId: string) {
        try {
            const myPostIds = await this.userService.findUserPostIds(userId);
            if (!myPostIds) {
                return handleResponse({
                    error: ERROR_GET_MY_POST_FOR_PAGINATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const myPosts: IResPost[] = await this.postModel
                .find(
                    {
                        _id: { $in: myPostIds.posts },
                    },
                    { updatedAt: 0, __v: 0 },
                )
                .sort({ createdAt: -1 })
                .populate('feeling', 'name emoji')
                .populate('reactions.user', 'name');

            const newUnionPostsWithUser = [];
            for (let i = 0; i < myPosts.length; i++) {
                const post = myPosts[i];

                const indexPost = myPostIds.posts.findIndex((id) => id.toString() === post._id.toString());
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
                        userId: myPostIds._id,
                        name: myPostIds.name,
                        avatar: await this.cloudinaryService.getImageUrl(myPostIds.avatar),
                        _id: post._id,
                        content: post.content,
                        feeling: post.feeling,
                        visibleFor: post.visibleFor,
                        images: newImages,
                        createdAt: post.createdAt,
                        comments: post.comments.length,
                        reactions: post.reactions,
                        postType: post.postType,
                    });
                }
            }

            return handleResponse({
                message: GET_MY_POST_FOR_PAGINATION_SUCCESSFULLY,
                data: newUnionPostsWithUser,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_MY_POST_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getPersonPostForPagination(myId: string, userId: string) {
        try {
            const allPersonPostIds = await this.userService.findUserPostIds(userId);
            if (!allPersonPostIds) {
                return handleResponse({
                    error: ERROR_GET_PERSON_POSTS_FOR_PAGINATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const isFriend = await this.userService.isAFriendToB(myId, userId);

            let myPosts: IResPost[] = [];
            if (isFriend) {
                myPosts = await this.postModel
                    .find(
                        {
                            _id: { $in: allPersonPostIds.posts },
                            visibleFor: { $in: ['public', 'friends'] },
                        },
                        { updatedAt: 0, __v: 0 },
                    )
                    .sort({ createdAt: -1 })
                    .populate('feeling', 'name emoji')
                    .populate('reactions.user', 'name');
            } else {
                myPosts = await this.postModel
                    .find(
                        {
                            _id: { $in: allPersonPostIds.posts },
                            visibleFor: { $eq: 'public' },
                        },
                        { updatedAt: 0, __v: 0 },
                    )
                    .sort({ createdAt: -1 })
                    .populate('feeling', 'name emoji')
                    .populate('reactions.user', 'name');
            }

            const newUnionPostsWithUser = [];
            for (let i = 0; i < myPosts.length; i++) {
                const post = myPosts[i];

                const indexPost = allPersonPostIds.posts.findIndex((id) => id.toString() === post._id.toString());
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
                        userId: allPersonPostIds._id,
                        name: allPersonPostIds.name,
                        avatar: await this.cloudinaryService.getImageUrl(allPersonPostIds.avatar),
                        _id: post._id,
                        content: post.content,
                        feeling: post.feeling,
                        visibleFor: post.visibleFor,
                        images: newImages,
                        createdAt: post.createdAt,
                        comments: post.comments.length,
                        reactions: post.reactions,
                        postType: post.postType,
                    });
                }
            }

            return handleResponse({
                message: GET_PERSON_POST_FOR_PAGINATION_SUCCESSFULLY,
                data: newUnionPostsWithUser,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_PERSON_POSTS_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async updatePost(postId: string, updatePost: IUpdatePost, imageFiles: Array<Express.Multer.File>) {
        try {
            // console.log('imageFiles: ', imageFiles);
            // console.log('updatePost: ', updatePost);
            const { content, feeling, visibleFor, deletedImages } = updatePost;
            if (!content && !feeling && !imageFiles && !visibleFor) {
                return handleResponse({
                    error: ERROR_POST_HAS_NO_DATA,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }
            const newImages: IImage[] = [];

            const oldPost = await this.postModel.findById(postId).populate('reactions.user', 'name');
            if (deletedImages) {
                oldPost.images.forEach((item) => {
                    this.cloudinaryService.deleteImage(item.publicId);
                });
                oldPost.images = [];
            }

            if (imageFiles.length === 0) {
                // console.log('khong xoa hinh > lay hinh cu');
                for (let index = 0; index < oldPost.images.length; index++) {
                    const image = oldPost.images[index];
                    const url = await this.cloudinaryService.getImageUrl(image.publicId);
                    newImages.push({
                        url,
                        orientation: image.orientation,
                    });
                }
            } else {
                const images: Image[] = [];

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

                oldPost.images = images;
            }

            oldPost.content = updatePost.content;
            oldPost.feeling = updatePost.feeling;
            oldPost.visibleFor = updatePost.visibleFor;

            await oldPost.save();

            const feelingDetail = await this.feelingService.findById(feeling);

            const responsePost = {
                _id: oldPost._id,
                content: oldPost.content,
                feeling: feelingDetail,
                visibleFor: oldPost.visibleFor,
                images: newImages,
                reactions: oldPost.reactions,
                comments: oldPost.comments.length,
            };
            return handleResponse({
                message: UPDATE_POST_SUCCESSFULLY,
                data: responsePost,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_UPDATE_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getParentCommentIds(postId: string) {
        const post = await this.postModel.findById(postId).select('comments');
        return post.comments;
    }

    async deletePost(useId: string, postId: string) {
        try {
            await this.userService.deletePost(useId, postId);
            const post = await this.postModel.findOneAndDelete({ _id: postId });

            post.images.forEach((item) => {
                this.cloudinaryService.deleteImage(item.publicId);
            });

            return handleResponse({
                message: DELETE_POST_SUCCESSFULLY,
                data: postId,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async createAvatarCoverPost(userId: string, content: string, typeUpdate: UpdateImage) {
        try {
            const user = await this.userService.findById(userId);
            const cover = await this.cloudinaryService.getImageUrl(user.coverPhoto);
            const avatar = await this.cloudinaryService.getImageUrl(user.avatar);

            if (typeUpdate === UpdateImage.Avatar) {
                const post = await this.postModel.create({
                    content,
                    images: [
                        {
                            publicId: user.avatar,
                            orientation: Orientation.Horizontal,
                        },
                        {
                            publicId: user.coverPhoto,
                            orientation: Orientation.Horizontal,
                        },
                    ],
                    visibleFor: VisibleFor.Public,
                    postType: 'avatar',
                });

                await this.userService.addPost(userId, post._id);

                const responsePost = {
                    _id: post._id,
                    userId: user._id,
                    avatar,
                    name: user.name,
                    content: post.content,
                    visibleFor: post.visibleFor,
                    images: [
                        {
                            url: avatar,
                            orientation: Orientation.Horizontal,
                        },
                        {
                            url: cover,
                            orientation: Orientation.Horizontal,
                        },
                    ],
                    reactions: [],
                    comments: 0,
                    createdAt: new Date().toISOString(),
                    typePost: post.postType,
                };

                return handleResponse({
                    message: CREATE_AVATAR_COVER_POST_SUCCESSFULLY,
                    data: responsePost,
                });
            }

            const post = await this.postModel.create({
                content,
                images: [
                    {
                        publicId: user.coverPhoto,
                        orientation: Orientation.Horizontal,
                    },
                ],
                visibleFor: VisibleFor.Public,
                postType: 'cover',
            });

            await this.userService.addPost(userId, post._id);

            const responsePost = {
                _id: post._id,
                userId: user._id,
                avatar,
                name: user.name,
                visibleFor: post.visibleFor,
                images: [
                    {
                        url: cover,
                        orientation: Orientation.Horizontal,
                    },
                ],
                reactions: [],
                comments: 0,
                createdAt: new Date().toISOString(),
                typePost: post.postType,
            };

            return handleResponse({
                message: CREATE_AVATAR_COVER_POST_SUCCESSFULLY,
                data: responsePost,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_AVATAR_COVER_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
