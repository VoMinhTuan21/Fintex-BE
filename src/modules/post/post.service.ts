import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_POST_SUCCESSFULLY,
    DELETE_COMMENT_SUCCESS,
    ERROR_ADD_COMMENT_TO_POST,
    ERROR_CREATE_POST,
    ERROR_DELETE_COMMENT_POST,
    ERROR_GET_COMMENT_POST,
    ERROR_GET_EXCEPTED_POST_ID,
    ERROR_GET_FRIEND_POST,
    ERROR_GET_FRIEND_POST_ID,
    ERROR_GET_POST_FOR_PAGINATION,
    ERROR_GET_POST_PAGINATION,
    ERROR_GET_STRANGER_POST,
    ERROR_NOT_FOUND,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_POST_HAS_NO_DATA,
    GET_POST_FOR_PAGINATION_SUCCESSFULLY,
    GET_POST_PAGINATION_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { PostResDto } from '../../dto/response/post.dto';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image } from '../../types/classes';
import { ICommentsIdPaginate, ICreatePost, IResponsePost } from '../../types/post';
import { comparePost } from '../../utils';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
        private readonly userService: UserService,
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

            for (let index = 0; index < imageFiles.length; index++) {
                const file = imageFiles[index];
                const { height, width, public_id } = await this.cloudinaryService.uploadImage(file, 'Fintex');
                const image: Image = {
                    publicId: public_id,
                    orientation: height >= width ? 'vertical' : 'horizontal',
                };
                images.push(image);
            }

            const post = await this.postModel.create({
                content,
                feeling,
                images,
                visibleFor,
            });

            await this.userService.addPost(userId, post._id);

            return handleResponse({
                message: CREATE_POST_SUCCESSFULLY,
                data: post,
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
                ended: index + limit > post.comments.length,
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
            const timeNow = new Date();
            timeNow.setDate(timeNow.getDate() - 7);

            const exceptedPosts = await this.userService.findExceptPost(userId);
            if (!exceptedPosts) {
                return handleResponse({
                    error: ERROR_GET_EXCEPTED_POST_ID,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const friendPostIds: string[] = await this.userService.findFriendsRecentPost(userId);
            if (!friendPostIds) {
                return handleResponse({
                    error: ERROR_GET_FRIEND_POST_ID,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const notStrangerPostIds = [...exceptedPosts, ...friendPostIds];

            //TODO: populate to get feeling and reaction of post
            const strangerPosts: IResponsePost[] = await this.postModel.find({
                _id: { $nin: notStrangerPostIds },
                createdAt: { $gt: timeNow },
            });
            if (!strangerPosts) {
                return handleResponse({
                    error: ERROR_GET_STRANGER_POST,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            //TODO: populate to get feeling and reaction of post
            const friendPosts: IResponsePost[] = await this.postModel.find({
                _id: { $in: friendPostIds },
            });
            if (!strangerPosts) {
                return handleResponse({
                    error: ERROR_GET_FRIEND_POST,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            friendPosts.sort((postA, postB) => comparePost(postA, postB));
            strangerPosts.sort((postA, postB) => comparePost(postA, postB));

            const unionPosts: IResponsePost[] = [];
            friendPosts.forEach((post) => {
                unionPosts.push({
                    _id: post._id,
                    content: post.content,
                    feeling: post.feeling,
                    images: post.images || [],
                    visibleFor: post.visibleFor,
                    reaction: post.reaction || [],
                    createdAt: post.createdAt,
                });
            });
            strangerPosts.forEach((post) => {
                unionPosts.push({
                    _id: post._id,
                    content: post.content,
                    feeling: post.feeling,
                    images: post.images || [],
                    visibleFor: post.visibleFor,
                    reaction: post.reaction || [],
                    createdAt: post.createdAt,
                });
            });

            return handleResponse({
                message: GET_POST_FOR_PAGINATION_SUCCESSFULLY,
                data: unionPosts,
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
            console.log('limit: ', typeof limit);
            const response = await this.getPostsForPagination(userId);
            const posts: IResponsePost[] = response.data;
            console.log('posts.length: ', posts.length);

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
}
