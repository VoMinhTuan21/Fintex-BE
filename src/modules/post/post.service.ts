import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_POST_SUCCESSFULLY,
    ERROR_ADD_COMMENT_TO_POST,
    ERROR_CREATE_POST,
    ERROR_GET_COMMENT_POST,
    ERROR_GET_FRIEND_POST_ID,
    ERROR_GET_POST_FOR_PAGINATION,
    ERROR_GET_STRANGER_POST_IDS,
    ERROR_POST_HAS_NO_DATA,
    GET_POST_FOR_PAGINATION_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { PostResDto } from '../../dto/response/post.dto';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image, PostIdWithUser } from '../../types/classes';
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
            let index: number;
            if (after) {
                index = post.comments.reverse().findIndex((item) => item.toString() === after);
            } else {
                index = 0;
            }

            const result: ICommentsIdPaginate = {
                commentsId: post.comments.reverse().slice(index, index + limit) as string[],
                after: index + limit < post.comments.length ? post.comments[index + limit].toString() : '',
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
            const unionPosts: IResponsePost[] = await this.postModel.find(
                {
                    _id: { $in: postIds },
                },
                { updatedAt: 0, __v: 0 },
            );
            if (!unionPosts) {
                return handleResponse({
                    error: ERROR_GET_STRANGER_POST_IDS,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }
            const newUnionPostsWithUser = [];
            unionPosts.forEach((post) => {
                unionPostsWithUser.forEach((user) => {
                    const indexPost = user.posts.findIndex((id) => id.toString() === post._id.toString());
                    if (indexPost !== -1) {
                        newUnionPostsWithUser.push({
                            userId: user._id,
                            name: user.name,
                            avatar: user.avatar,
                            _id: post._id,
                            content: post.content,
                            feeling: post.feeling,
                            visibleFor: post.visibleFor,
                            images: post.images,
                            createdAt: post.createdAt,
                            comments: post.comments ? post.comments.length : 0,
                        });
                        console.log('vo khong');
                    }
                });
            });

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

    // async findPostPagination(userId: string, limit: number, after: string) {
    //     try {
    //         console.log('limit: ', typeof limit);
    //         const response = await this.getPostsForPagination(userId);
    //         const posts: IResponsePost[] = response.data;
    //         console.log('posts.length: ', posts.length);

    //         if (after) {
    //             const indexAfter = posts.findIndex((post) => post._id.toString() === after);
    //             console.log('indexAfter: ', indexAfter);
    //             if (indexAfter) {
    //                 if (indexAfter + limit < posts.length) {
    //                     return handleResponse({
    //                         message: GET_POST_PAGINATION_SUCCESSFULLY,
    //                         data: {
    //                             posts: posts.slice(indexAfter, indexAfter + limit),
    //                             after: posts[indexAfter + limit]._id,
    //                             ended: false,
    //                         },
    //                     });
    //                 } else {
    //                     return handleResponse({
    //                         message: GET_POST_PAGINATION_SUCCESSFULLY,
    //                         data: {
    //                             posts: posts.slice(indexAfter),
    //                             after: '',
    //                             ended: true,
    //                         },
    //                     });
    //                 }
    //             } else {
    //                 return handleResponse({
    //                     message: GET_POST_PAGINATION_SUCCESSFULLY,
    //                     data: {
    //                         posts: [],
    //                         after: '',
    //                         ended: true,
    //                     },
    //                 });
    //             }
    //         } else {
    //             if (posts.length > limit) {
    //                 return handleResponse({
    //                     message: GET_POST_PAGINATION_SUCCESSFULLY,
    //                     data: {
    //                         posts: posts.slice(0, limit),
    //                         after: posts[limit]._id,
    //                         ended: false,
    //                     },
    //                 });
    //             } else {
    //                 return handleResponse({
    //                     message: GET_POST_PAGINATION_SUCCESSFULLY,
    //                     data: {
    //                         posts: posts,
    //                         after: '',
    //                         ended: true,
    //                     },
    //                 });
    //             }
    //         }
    //     } catch (error) {
    //         console.log('error: ', error);
    //         return handleResponse({
    //             error: error.response?.error || ERROR_GET_POST_PAGINATION,
    //             statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
    //         });
    //     }
    // }
}
