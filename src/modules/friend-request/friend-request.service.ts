import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CHECK_RELATIONSHIP_SUCCESS,
    CREATE_FRIEND_REQ_SUCCESS,
    ERROR_CHECK_RELATIONSHIP,
    ERROR_CREATE_FRIEND_REQ,
    ERROR_FRIEND_REQ_EXISTED,
} from '../../constances/friendReqResponseMessage';
import { handleResponse } from '../../dto/response';
import { FriendRequest, FriendRequestDocument } from '../../schemas/friend-request.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventsGateway } from '../event/event.gateway';
import { UserService } from '../user/user.service';

@Injectable()
export class FriendRequestService {
    constructor(
        @InjectModel(FriendRequest.name) private friendReqModel: Model<FriendRequestDocument>,
        private readonly userService: UserService,
        private readonly eventGateway: EventsGateway,
        private readonly cloudinaryService: CloudinaryService,
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

            // const friendReq = await this.friendReqModel.create({
            //     from: fromId,
            //     to: toId,
            // });

            const fromUser = await this.userService.getSimpleInfo(fromId);

            const toUser = await this.userService.getSimpleInfo(toId);

            this.eventGateway.sendFriendReq(
                {
                    _id: '1234',
                    // _id: friendReq._id,
                    user: fromUser,
                },
                toId,
            );

            return handleResponse({
                message: CREATE_FRIEND_REQ_SUCCESS,
                data: {
                    _id: '1234',
                    // _id: friendReq._id,
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
}
