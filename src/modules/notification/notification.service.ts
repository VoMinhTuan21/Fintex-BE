import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CREATE_NOTI_SUCCESS,
    ERROR_CREATE_NOTI,
    ERROR_GET_NOTIFY_FOR_PAGINATION,
    GET_NOTIFY_FOR_PAGINATION_SUCCESS,
    GET_NOTIFY_PAGINATION_SUCCESS,
    ERROR_GET_NOTIFY_PAGINATION,
    ERROR_HANDLE_SEE_NOTIFY,
    HANDLE_SEE_NOTIFY_SUCCESS,
} from '../../constances/notiResponseMessage';
import { handleResponse } from '../../dto/response';
import { NotificationDocument, Notification } from '../../schemas/notification.schema';
import { handleConvNotiContent, handleFriendReqNotiContent, handlePostNotiContent } from '../../utils/notification';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserService } from '../user/user.service';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name) private notiModel: Model<NotificationDocument>,
        private readonly userService: UserService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async create(body: ICreateNoti) {
        try {
            const fromUser = await this.userService.getSimpleInfo(body.fromId);

            if (['createFriendReq', 'acceptFriendReq', 'deleteFriend'].includes(body.type)) {
                const subContent = handleFriendReqNotiContent(body.type);

                const noti = await this.notiModel.create({
                    from: body.fromId,
                    to: body.toId,
                    content: `${fromUser.name.fullName} ${subContent}`,
                    type: body.type,
                });

                return handleResponse({
                    message: CREATE_NOTI_SUCCESS,
                    data: {
                        _id: noti._id,
                        type: noti.type,
                        content: noti.content,
                        from: fromUser,
                        isSeen: noti.isSeen,
                        createdAt: new Date().toISOString(),
                    },
                });
            } else if (
                ['createPost', 'reactionPost', 'commentPost', 'replyComment', 'reactionComment'].includes(body.type)
            ) {
                const subContent = handlePostNotiContent(body.type);
                const noti = await this.notiModel.create({
                    from: body.fromId,
                    to: body.toId,
                    content: `${fromUser.name.fullName} ${subContent}`,
                    postId: body.postId,
                    postPersonId: body.postPersonId,
                    type: body.type,
                });

                return handleResponse({
                    message: CREATE_NOTI_SUCCESS,
                    data: {
                        _id: noti._id,
                        type: noti.type,
                        content: noti.content,
                        postId: noti.postId,
                        postPersonId: noti.postPersonId,
                        from: fromUser,
                        to: noti.to,
                        isSeen: noti.isSeen,
                        createdAt: new Date().toISOString(),
                    },
                });
            } else if (['addMemberConv'].includes(body.type)) {
                const subContent = handleConvNotiContent(body.type, body.conversationName);

                const noti = await this.notiModel.create({
                    from: body.fromId,
                    to: body.toId,
                    content: `${fromUser.name.fullName} ${subContent}`,
                    conversationId: body.conversationId,
                    type: body.type,
                });

                return handleResponse({
                    message: CREATE_NOTI_SUCCESS,
                    data: {
                        _id: noti._id,
                        type: noti.type,
                        content: noti.content,
                        from: fromUser,
                        isSeen: noti.isSeen,
                        createdAt: new Date().toISOString(),
                        conversationId: noti.conversationId,
                    },
                });
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_NOTI,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getNotifyForPagination(userId: string) {
        try {
            const response: any[] = await this.notiModel
                .find(
                    { to: userId },
                    { _id: 1, type: 1, content: 1, from: 1, postId: 1, postPersonId: 1, isSeen: 1, createdAt: 1 },
                )
                .sort({ createdAt: -1 })
                .populate('from', 'name avatar');

            for (let i = 0; i < response.length; i++) {
                const fromUser = response[i].from;
                fromUser.avatar = await this.cloudinaryService.getImageUrl(fromUser.avatar);
            }

            return handleResponse({
                message: GET_NOTIFY_FOR_PAGINATION_SUCCESS,
                data: response,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_NOTIFY_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getNotifyPagination(userId: string, limit: number, after: string) {
        try {
            const response = await this.getNotifyForPagination(userId);
            const notify = response.data;

            if (after) {
                const indexAfter = notify.findIndex((req: any) => req._id.toString() === after);
                if (indexAfter) {
                    if (indexAfter + limit < notify.length) {
                        return handleResponse({
                            message: GET_NOTIFY_PAGINATION_SUCCESS,
                            data: {
                                notify: notify.slice(indexAfter, indexAfter + limit),
                                after: notify[indexAfter + limit]._id,
                                ended: false,
                            },
                        });
                    } else {
                        return handleResponse({
                            message: GET_NOTIFY_PAGINATION_SUCCESS,
                            data: {
                                notify: notify.slice(indexAfter),
                                after: '',
                                ended: true,
                            },
                        });
                    }
                } else {
                    return handleResponse({
                        message: GET_NOTIFY_PAGINATION_SUCCESS,
                        data: {
                            notify: [],
                            after: '',
                            ended: true,
                        },
                    });
                }
            } else {
                if (notify.length > limit) {
                    return handleResponse({
                        message: GET_NOTIFY_PAGINATION_SUCCESS,
                        data: {
                            notify: notify.slice(0, limit),
                            after: notify[limit]._id,
                            ended: false,
                        },
                    });
                } else {
                    console.log('vo khong');
                    return handleResponse({
                        message: GET_NOTIFY_PAGINATION_SUCCESS,
                        data: {
                            notify: notify,
                            after: '',
                            ended: true,
                        },
                    });
                }
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_NOTIFY_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async handleSeeNofify(body: { id: string }[]) {
        try {
            const notifyId: string[] = body.map((item) => item.id);

            await this.notiModel.updateMany(
                { _id: { $in: notifyId } },
                {
                    $set: { isSeen: true },
                },
            );
            return handleResponse({
                message: HANDLE_SEE_NOTIFY_SUCCESS,
                data: null,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_HANDLE_SEE_NOTIFY,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
