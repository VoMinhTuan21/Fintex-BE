import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_COMMENT_SUCCESS,
    DELETE_ALL_COMMENT_OF_POST_SUCCESSFULLY,
    DELETE_COMMENT_SUCCESS,
    ERROR_CREATE_COMMENT,
    ERROR_DELETE_ALL_COMMENT_OF_POST,
    ERROR_DELETE_COMMENT,
    ERROR_GET_ALL_PARENT_COMMENT_IDS_OF_POST,
    ERROR_NOT_FOUND,
    ERROR_NOT_HAVE_PERMISSION,
    ERROR_NOW_ALLOW_TO_REPLY_COMMENT_LEVEL_3,
    ERROR_REACT_COMMENT,
    GET_COMMENT_SUCCESS,
    ReactionEnum,
    REACT_COMMENT_SUCCESS,
    UPDATE_COMMENT_SUCCESS,
} from '../../constances';
import { CreateCommentDto, UpdateCommentDto } from '../../dto/request';
import { handleResponse } from '../../dto/response';
import { CommnentResDto, CreateCommentResDto, ReactionCommentResDto } from '../../dto/response/comment.dto';
import { Comment, CommentDocument } from '../../schemas/comment.schema';
import { ICommentsIdPaginate } from '../../types/post';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventsGateway } from '../event/event.gateway';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly postService: PostService,
        private readonly userService: UserService,
        private readonly notifyService: NotificationService,
        private readonly eventGateway: EventsGateway,
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

        for (const comment of comments) {
            comment.postId = postId;
            if (comment.image) {
                comment.image = await this.cloudinaryService.getImageUrl(comment.image);
            }
            if (comment.avatar) {
                comment.avatar = await this.cloudinaryService.getImageUrl(comment.avatar);
            }
            comment.commentsChildren = await this.commentModel.find({ parentId: comment._id }).count();

            if (comment.reaction.length > 0) {
                for (const reaction of comment.reaction) {
                    const user = await this.userService.findById(reaction.userId);
                    reaction.user = {
                        _id: user._id,
                        name: user.name,
                    };
                    delete reaction.userId;
                }
            }
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

            // add notification socket
            if (!dto.parentId) {
                if (userId !== dto.postPersonId) {
                    const notify = await this.notifyService.create({
                        fromId: userId,
                        toId: dto.postPersonId,
                        type: 'commentPost',
                        postId: dto.postId,
                        postPersonId: dto.postPersonId,
                    });

                    this.eventGateway.sendNotify({ notify: notify.data }, dto.postPersonId);
                }
            } else {
                console.log('vo reply comment notify');
                const parentComment = await this.commentModel.findById(dto.parentId);

                if (parentComment.userId.toString() !== userId) {
                    const notify = await this.notifyService.create({
                        fromId: userId,
                        toId: parentComment.userId.toString(),
                        type: 'replyComment',
                        postId: dto.postId,
                        postPersonId: dto.postPersonId,
                    });

                    this.eventGateway.sendNotify({ notify: notify.data }, parentComment.userId.toString());
                }
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

    async delete(id: string, userId: string, postId: string) {
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

            if (!comment.parentId) {
                await this.postService.deleteComment(postId, id, userId);
            }

            const childrenId = await this.deleteChildComment(id);

            comment.delete();
            return handleResponse({
                message: DELETE_COMMENT_SUCCESS,
                data: [id, ...childrenId],
            });
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_COMMENT,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteChildComment(id: string) {
        const children = await this.commentModel.find({ parentId: id });
        if (children.length === 0) {
            return [];
        }
        const result: string[] = [];
        for (const item of children) {
            result.push(item._id);
            if (item.level !== 3) {
                const outcome = await this.deleteChildComment(item._id);
                result.push(...outcome);
            }
            if (item.image) {
                this.cloudinaryService.deleteImage(item.image);
            }
            item.delete();
        }

        return result;
    }

    async reaction(id: string, type: ReactionEnum, userId: string, postId: string, postPersonId: string) {
        try {
            const comment = await this.commentModel.findById(id);
            if (!comment) {
                return handleResponse({
                    error: ERROR_NOT_FOUND,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const user = await this.userService.findById(userId);
            const index = comment.reaction.findIndex((item) => item.userId.toString() === userId);

            if (index >= 0) {
                comment.reaction[index].type = type;
            } else {
                comment.reaction.push({
                    type: type,
                    userId: new mongoose.Types.ObjectId(userId).toString(),
                });
            }

            await comment.save();

            if (comment.userId.toString() !== userId) {
                const notify = await this.notifyService.create({
                    fromId: userId,
                    toId: comment.userId.toString(),
                    type: 'reactionComment',
                    postId,
                    postPersonId,
                });

                this.eventGateway.sendNotify({ notify: notify.data }, comment.userId.toString());
            }

            const outcome: ReactionCommentResDto = {
                commentId: id,
                type: type,
                user: {
                    _id: user._id,
                    name: user.name,
                },
            };

            return handleResponse({
                message: REACT_COMMENT_SUCCESS,
                data: outcome,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_REACT_COMMENT,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteAllCommentOfPost(postId: string) {
        try {
            const commentIds = await this.postService.getParentCommentIds(postId);
            if (!commentIds) {
                return handleResponse({
                    error: ERROR_GET_ALL_PARENT_COMMENT_IDS_OF_POST,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const deletedCommentIds: string[] = [];
            for (const commentId of commentIds) {
                const res = await this.deleteChildComment(commentId.toString());
                const parentComment = await this.commentModel.findOneAndDelete({ _id: commentId });
                if (parentComment.image) {
                    this.cloudinaryService.deleteImage(parentComment.image);
                }
                deletedCommentIds.push(...res, parentComment._id);
            }

            return handleResponse({
                message: DELETE_ALL_COMMENT_OF_POST_SUCCESSFULLY,
                data: deletedCommentIds,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_ALL_COMMENT_OF_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
