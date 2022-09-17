import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_COMMENT_SUCCESS,
    DELETE_COMMENT_SUCCESS,
    ERROR_CREATE_COMMENT,
    ERROR_DELETE_COMMENT,
    ERROR_NOT_FOUND,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_NOW_ALLOW_TO_REPLY_COMMENT_LEVEL_3,
    GET_COMMENT_SUCCESS,
    UPDATE_COMMENT_SUCCESS,
} from '../../constances';
import { CreateCommentDto, UpdateCommentDto } from '../../dto/request';
import { handleResponse } from '../../dto/response';
import { CommnentResDto, CreateCommentResDto } from '../../dto/response/comment.dto';
import { Comment, CommentDocument } from '../../schemas';
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

    async getComments(commentsId: string[], after: string, ended: boolean, postId: string) {
        const comments: CommnentResDto[] = await this.commentModel.aggregate([
            {
                $match: { _id: { $in: commentsId } },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        {
                            $project: { avatar: 1, name: 1, userId: '$_id' },
                        },
                    ],
                },
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$user', 0] }, '$$ROOT'] } },
            },
            { $sort: { createdAt: -1 } },
            { $project: { user: 0, __v: 0, updatedAt: 0 } },
        ]);

        for (let i = 0; i < comments.length; i++) {
            comments[i].postId = postId;
            if (comments[i].image) {
                comments[i].image = await this.cloudinaryService.getImageUrl(comments[i].image);
            }
            if (comments[i].avatar) {
                comments[i].avatar = await this.cloudinaryService.getImageUrl(comments[i].avatar);
            }
            comments[i].commentsChildren = await this.commentModel.find({ parentId: comments[i]._id }).count();
        }

        return handleResponse({
            message: GET_COMMENT_SUCCESS,
            data: {
                comments: comments,
                after: after,
                ended: ended,
            },
        });
    }

    async getCommentParent(postId: string, limit: number, oldAfter: string) {
        const { commentsId, after, ended } = (await this.postService.getComments(
            postId,
            limit,
            oldAfter,
        )) as ICommentsIdPaginate;

        return this.getComments(commentsId, after, ended, postId);
    }

    async getCommentChildren(postId: string, parentId: string, limit: number, after: string) {
        const comments = await this.commentModel.aggregate([
            { $match: { parentId: new mongoose.Types.ObjectId(parentId) } },
            { $sort: { createdAt: -1 } },
            { $project: { _id: 1 } },
        ]);

        const restructComments = comments.map((item) => item._id);
        let index = 0;

        if (after) {
            index = restructComments.findIndex((item) => item.toString() === after);
        }

        const commentsId = restructComments.slice(index, index + limit);
        const newAfter = index + limit < restructComments.length ? restructComments[index + limit].toString() : '';
        const ended = index + limit > restructComments.length;

        return this.getComments(commentsId, newAfter, ended, postId);
    }

    async getAfter(commentId: string, parentId: string) {
        const comments = await this.commentModel.aggregate([
            {
                $match: {
                    parentId: new mongoose.Types.ObjectId(parentId),
                },
            },
            { $sort: { createdAt: -1 } },
            { $project: { _id: 1 } },
        ]);

        const index = comments.findIndex((item) => item._id.toString() === commentId);
        if (index === comments.length - 1) {
            return '';
        }

        return comments[index + 1]._id.toString();
    }

    async create(dto: CreateCommentDto, userId: string) {
        try {
            let imageComment = '';

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
                const { public_id } = await this.cloudinaryService.uploadImage(dto.image, 'comment');

                imageComment = public_id;
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

            const comment: CommnentResDto[] = await this.commentModel.aggregate([
                {
                    $match: { _id: result._id },
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

            if (comment[0].image) {
                comment[0].image = await this.cloudinaryService.getImageUrl(comment[0].image);
            }
            comment[0].avatar = await this.cloudinaryService.getImageUrl(comment[0].avatar);
            comment[0].postId = dto.postId;
            comment[0].commentsChildren = await this.commentModel.find({ parentId: comment[0]._id }).count();

            let after = '';
            if (dto.parentId) {
                after = await this.getAfter(comment[0]._id.toString(), dto.parentId);
            } else {
                after = await this.postService.getAfter(dto.postId, comment[0]._id.toString());
            }

            return handleResponse({
                message: CREATE_COMMENT_SUCCESS,
                data: {
                    comment: comment[0],
                    after: after,
                } as CreateCommentResDto,
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

            if (!dto.oldImage && comment.image) {
                this.cloudinaryService.deleteImage(comment.image);
                comment.image = '';
            }

            if (dto.image) {
                const { public_id } = await this.cloudinaryService.uploadImage(dto.image, 'comment');

                comment.image = public_id;
            }

            (comment.content = dto.content), (comment.isNew = false);

            comment.save();

            return handleResponse({
                message: UPDATE_COMMENT_SUCCESS,
                data: {
                    _id: comment._id,
                    content: comment.content,
                    image: comment.image ? await this.cloudinaryService.getImageUrl(comment.image) : comment.image,
                },
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

            if (comment.image) {
                this.cloudinaryService.deleteImage(comment.image);
            }

            comment.delete();
            return handleResponse({
                message: DELETE_COMMENT_SUCCESS,
                data: id,
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_COMMENT,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
