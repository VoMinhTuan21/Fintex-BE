import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_POST_SUCCESSFULLY,
    ERROR_ADD_COMMENT_TO_POST,
    ERROR_CREATE_POST,
    ERROR_GET_COMMENT_POST,
    ERROR_POST_HAS_NO_DATA,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image } from '../../types/classes';
import { ICommentsIdPaginate, ICreatePost } from '../../types/post';
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

    // async findPostPagination(userId: string, limit: number){
    //     const exceptPosts = await this.userService.findExceptPost(userId);

    //     const
    // }
}
