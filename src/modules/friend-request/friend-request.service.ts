import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, mongo } from 'mongoose';
import {
    CHECK_RELATIONSHIP_SUCCESS,
    CREATE_FRIEND_REQ_SUCCESS,
    DELETE_FRIEND_REQ_SUCCESS,
    ERROR_ACCEPT_FRIEND_REQ,
    ERROR_CHECK_RELATIONSHIP,
    ERROR_CREATE_FRIEND_REQ,
    ERROR_DELETE_FRIEND_REQ,
    ERROR_FIND_USER_BY_NAME,
    ERROR_FRIEND_REQ_EXISTED,
    ERROR_GET_RECEIVE_FRIEND_REQ_FOR_PAGINATION,
    ERROR_GET_FRIEND_REQ_PAGINATION,
    ERROR_GET_SEND_FRIEND_REQ_FOR_PAGINATION,
    FIND_USER_BY_NAME_SUCCESS,
    GET_FRIEND_REQ_FOR_PAGINATION_SUCCESS,
    GET_FRIEND_REQ_PAGINATION_SUCCESS,
} from '../../constances/friendReqResponseMessage';
import { handleResponse } from '../../dto/response';
import { FriendRequest, FriendRequestDocument } from '../../schemas/friend-request.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventsGateway } from '../event/event.gateway';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class FriendRequestService {
    constructor(
        @InjectModel(FriendRequest.name) private friendReqModel: Model<FriendRequestDocument>,
        private readonly userService: UserService,
        private readonly eventGateway: EventsGateway,
        private readonly cloudinaryService: CloudinaryService,
        private readonly notiService: NotificationService,
    ) {}

    async create(fromId: string, toId: string) {
        try {
            // const existReq = await this.friendReqModel.findOne({
            //     from: fromId,
            //     to: toId,
            // });
            // if (existReq) {
            //     return handleResponse({
            //         error: ERROR_FRIEND_REQ_EXISTED,
            //         statusCode: HttpStatus.CONFLICT,
            //     });
            // }

            const friendReq = await this.friendReqModel.create({
                from: fromId,
                to: toId,
            });

            const fromUser = await this.userService.getSimpleInfo(fromId);

            const toUser = await this.userService.getSimpleInfo(toId);

            this.eventGateway.sendFriendReq(
                {
                    _id: friendReq._id,
                    user: fromUser,
                },
                toId,
            );

            // create notification record and send to receiver
            const noti = await this.notiService.create({
                fromId,
                toId,
                type: 'createFriendReq',
            });

            this.eventGateway.sendNotify({ notify: noti.data }, toId);

            return handleResponse({
                message: CREATE_FRIEND_REQ_SUCCESS,
                data: {
                    _id: friendReq._id,
                    user: toUser,
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_FRIEND_REQ,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async checkRelationship(fromId: string, toId: string) {
        try {
            const existReq = await this.friendReqModel.findOne({
                from: fromId,
                to: toId,
            });
            if (existReq) {
                return handleResponse({
                    message: CHECK_RELATIONSHIP_SUCCESS,
                    data: 'requesting',
                });
            }

            const isFriend = await this.userService.isAFriendToB(fromId, toId);
            if (isFriend) {
                return handleResponse({
                    message: CHECK_RELATIONSHIP_SUCCESS,
                    data: 'isFriend',
                });
            } else {
                return handleResponse({
                    message: CHECK_RELATIONSHIP_SUCCESS,
                    data: 'notFriend',
                });
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CHECK_RELATIONSHIP,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getReceiveFriendReqForPagination(userId: string) {
        try {
            const response: any[] = await this.friendReqModel
                .find({ to: userId }, { _id: 1, from: 1, createdAt: 1 })
                .sort({ createdAt: -1 })
                .populate('from', 'name avatar');

            const receiveFriendRes: any[] = [];
            for (let i = 0; i < response.length; i++) {
                const fromUser = response[i].from;
                fromUser.avatar = await this.cloudinaryService.getImageUrl(fromUser.avatar);
                receiveFriendRes.push({
                    _id: response[i]._id,
                    user: {
                        _id: fromUser._id,
                        name: fromUser.name,
                        avatar: fromUser.avatar,
                    },
                });
            }

            return handleResponse({
                message: GET_FRIEND_REQ_FOR_PAGINATION_SUCCESS,
                data: receiveFriendRes,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_RECEIVE_FRIEND_REQ_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getSendFriendReqForPagination(userId: string) {
        try {
            const response: any[] = await this.friendReqModel
                .find({ from: userId }, { _id: 1, to: 1, createdAt: 1 })
                .sort({ createdAt: -1 })
                .populate('to', 'name avatar');

            const sendFriendRes: any[] = [];
            for (let i = 0; i < response.length; i++) {
                const toUser = response[i].to;
                toUser.avatar = await this.cloudinaryService.getImageUrl(toUser.avatar);
                sendFriendRes.push({
                    _id: response[i]._id,
                    user: {
                        _id: toUser._id,
                        name: toUser.name,
                        avatar: toUser.avatar,
                    },
                });
            }

            return handleResponse({
                message: GET_FRIEND_REQ_FOR_PAGINATION_SUCCESS,
                data: sendFriendRes,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_SEND_FRIEND_REQ_FOR_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getReceiveFriendReqPagination(userId: string, limit: number, after: string, type: string) {
        try {
            let response: any;
            if (type === 'receive') {
                response = await this.getReceiveFriendReqForPagination(userId);
            } else {
                response = await this.getSendFriendReqForPagination(userId);
            }
            const friendReqs = response.data;

            if (after) {
                const indexAfter = friendReqs.findIndex((req: any) => req._id.toString() === after);
                if (indexAfter) {
                    if (indexAfter + limit < friendReqs.length) {
                        return handleResponse({
                            message: GET_FRIEND_REQ_PAGINATION_SUCCESS,
                            data: {
                                friendReqs: friendReqs.slice(indexAfter, indexAfter + limit),
                                after: friendReqs[indexAfter + limit]._id,
                                ended: false,
                            },
                        });
                    } else {
                        return handleResponse({
                            message: GET_FRIEND_REQ_PAGINATION_SUCCESS,
                            data: {
                                friendReqs: friendReqs.slice(indexAfter),
                                after: '',
                                ended: true,
                            },
                        });
                    }
                } else {
                    return handleResponse({
                        message: GET_FRIEND_REQ_PAGINATION_SUCCESS,
                        data: {
                            friendReqs: [],
                            after: '',
                            ended: true,
                        },
                    });
                }
            } else {
                if (friendReqs.length > limit) {
                    return handleResponse({
                        message: GET_FRIEND_REQ_PAGINATION_SUCCESS,
                        data: {
                            friendReqs: friendReqs.slice(0, limit),
                            after: friendReqs[limit]._id,
                            ended: false,
                        },
                    });
                } else {
                    console.log('vo khong');
                    return handleResponse({
                        message: GET_FRIEND_REQ_PAGINATION_SUCCESS,
                        data: {
                            friendReqs: friendReqs,
                            after: '',
                            ended: true,
                        },
                    });
                }
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_FRIEND_REQ_PAGINATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async acceptFriendReq(friendReqId: string) {
        try {
            const friendReq = await this.friendReqModel.findOneAndDelete({ _id: friendReqId });

            await this.userService.addFriend(friendReq.from.toString(), friendReq.to.toString());
            await this.userService.addFriend(friendReq.to.toString(), friendReq.from.toString());

            const notify = await this.notiService.create({
                fromId: friendReq.to.toString(),
                toId: friendReq.from.toString(),
                type: 'acceptFriendReq',
            });

            this.eventGateway.sendNotify({ notify: notify.data, friendReqId }, friendReq.from.toString());

            return handleResponse({
                message: CREATE_FRIEND_REQ_SUCCESS,
                data: friendReqId,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_ACCEPT_FRIEND_REQ,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteFriendReq(friendReqId: string) {
        try {
            await this.friendReqModel.findOneAndDelete({ _id: friendReqId });
            return handleResponse({
                message: DELETE_FRIEND_REQ_SUCCESS,
                data: friendReqId,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_FRIEND_REQ,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async findUserByName(userId: string, name: string, limit: number, after: string) {
        try {
            const response = await this.userService.findByName(name, limit, after, userId);
            const users = response.data.data;
            const newAfter = response.data.after;

            for (const user of users) {
                user.relationship = (await this.checkRelationship(userId, user._id)).data;
            }

            return handleResponse({
                message: FIND_USER_BY_NAME_SUCCESS,
                data: {
                    data: users,
                    after: newAfter,
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_FIND_USER_BY_NAME,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
