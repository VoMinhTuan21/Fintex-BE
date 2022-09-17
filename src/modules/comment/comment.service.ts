import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CREATE_COMMENT_SUCCESS,
    DELETE_COMMENT_SUCCESS,
    ERROR_CREATE_COMMENT,
    ERROR_NOT_FOUND,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_NOW_ALLOW_TO_REPLY_COMMENT_LEVEL_3,
    GET_COMMENT_SUCCESS,
    UPDATE_COMMENT_SUCCESS,
} from '../../constances';
import { CreateCommentDto, GetParentCommentsDto, UpdateCommentDto } from '../../dto/request';
import { handleResponse } from '../../dto/response';
import { Comment, CommentDocument } from '../../schemas';
import { Image } from '../../types/classes';
import { Orientation } from '../../types/enums/orientation';
import { ICommentsIdPaginate } from '../../types/post';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PostService } from '../post/post.service';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly postService: PostService,
    ) {}

    async getCommentParent(postId: string, limit: number, after: string) {
        const commentsId = (await this.postService.getComments(postId, limit, after)) as ICommentsIdPaginate;
        const comments: GetParentCommentsDto[] = await this.commentModel.aggregate([
            {
                $match: { _id: { $in: commentsId.commentsId } },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        {
                            $project: { avatar: 1, name: 1 },
                        },
                    ],
                },
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$user', 0] }, '$$ROOT'] } },
            },
            { $project: { user: 0, __v: 0, updatedAt: 0 } },
            { $sort: { createdAt: -1 } },
        ]);
        return handleResponse({
            message: GET_COMMENT_SUCCESS,
            data: {
                comments: comments,
                after: commentsId.after,
                ended: commentsId.ended,
            },
        });
    }

    async create(dto: CreateCommentDto, userId: string) {
        try {
            const imageComment: Image = {
                publicId: '',
                orientation: Orientation.Vertical,
            };

            let level = 1;

            if (dto.parentId) {
                const comment = await this.commentModel.findById(dto.parentId);
                if (comment.level == 3) {
                    return handleResponse({
                        error: ERROR_NOW_ALLOW_TO_REPLY_COMMENT_LEVEL_3,
                        statusCode: HttpStatus.NOT_ACCEPTABLE,
                    });
                } else {
                    level = comment.level + 1;
                }
            }

            if (dto.image) {
                const { height, width, public_id } = await this.cloudinaryService.uploadImage(dto.image, 'comment');

                imageComment.publicId = public_id;
                imageComment.orientation = height >= width ? Orientation.Vertical : Orientation.Horizontal;
            }

            const result = await this.commentModel.create({
                userId: userId,
                content: dto.content,
                image: imageComment,
                parentId: dto.parentId,
                level: level,
            });

            if (!dto.parentId) {
                await this.postService.addComment(dto.postId, result._id.toString());
            }

            return handleResponse({
                message: CREATE_COMMENT_SUCCESS,
                data: result,
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_COMMENT,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async update(dto: UpdateCommentDto, userId: string) {
        try {
            const comment = await this.commentModel.findById(dto.id);
            if (userId !== comment.userId.toString()) {
                return handleResponse({
                    error: ERROR_NOT_HAVE_PERMISSION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            if (!dto.oldImage) {
                this.cloudinaryService.deleteImage(comment.image.publicId);
                comment.image.publicId = '';
            }

            if (dto.image) {
                const { height, width, public_id } = await this.cloudinaryService.uploadImage(dto.image, 'comment');

                comment.image.publicId = public_id;
                comment.image.orientation = height >= width ? Orientation.Vertical : Orientation.Horizontal;
            }

            (comment.content = dto.content), (comment.isNew = false);

            comment.save();

            return handleResponse({
                message: UPDATE_COMMENT_SUCCESS,
                data: comment,
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_COMMENT,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async delelte(id: string, userId: string) {
        try {
            const comment = await this.commentModel.findById(id);
            if (!comment) {
                return handleResponse({
                    error: ERROR_NOT_FOUND,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            if (userId !== comment.userId.toString()) {
                return handleResponse({
                    error: ERROR_NOT_HAVE_PERMISSION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            if (comment.image.publicId) {
                this.cloudinaryService.deleteImage(comment.image.publicId);
            }

            comment.delete();
            return handleResponse({
                message: DELETE_COMMENT_SUCCESS,
                data: id,
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_COMMENT,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
