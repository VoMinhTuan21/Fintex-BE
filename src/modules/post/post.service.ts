import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CREATE_POST_SUCCESSFULLY, ERROR_CREATE_POST, ERROR_POST_HAS_NO_DATA } from '../../constances';
import { handleResponse } from '../../dto/response';
import { Post, PostDocument } from '../../schemas/post.schema';
import { Image } from '../../types/classes';
import { ICreatePost } from '../../types/post';
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
                    orientation: height > width ? 'vertical' : 'horizontal',
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

    // async findPostPagination(userId: string, limit: number){
    //     const exceptPosts = await this.userService.findExceptPost(userId);

    //     const
    // }
}
