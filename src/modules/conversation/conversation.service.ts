import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ERROR_NOT_HAVE_PERMISSION, ERROR_USER_NOT_FOUND, USER_NOT_EXISTED } from '../../constances';
import {
    ERROR_EXISTED_CONVERSATION,
    CREATE_CONVERSATION_SUCCESSFULLY,
    ERROR_CREATE_CONVERSATION,
    ERROR_ADD_MESSAGE_TO_CONVERSATION,
    GET_CONVERSATIONS_SUCCESSFULLY,
    ERROR_GET_CONVERSATIONS,
    ERROR_RENAME_CONVERSATION,
    ERROR_NEW_AMIN_NOT_IN_CONVERSATION,
    ERROR_SWITCH_ADMIN,
    ERROR_NOT_FOUND_CONVERSATION,
    ERROR_NOT_IS_CONV_ADMIN,
    ERROR_USER_NOT_IN_CONV,
    REMOVE_MEMBER_SUCCESSFULLY,
    RENAME_CONVERSATION_SUCCESSFULLY,
    SWITCH_ADMIN_SUCCESSFULLY,
    LEAVE_CONVERSATION_SUCCESSFULLY,
    ERROR_LEAVE_CONVERSATION,
    ERROR_USER_NOT_IN_CONVERSATION,
    ERROR_ADMIN_NOT_ALLOW_TO_LEAVE,
    ERROR_ADD_MEMBER_TO_CONVERSATION,
    ADD_MEMBER_SUCCESSFULLY,
    ERROR_CANNOT_REMOVE_MYSEFF,
    ERROR_USER_ALREADY_IN_CONVERSATION,
    ERROR_DELETE_CONVERSATION,
} from '../../constances/conversationResponseMessage';
import { handleResponse } from '../../dto/response';
import { ConversationResDto } from '../../dto/response/conversation.dto';
import { User, UserDocument } from '../../schemas';
import { Conversation, ConversationDocument } from '../../schemas/conversation.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventsGateway } from '../event/event.gateway';
import { MessageService } from '../message/message.service';
import { MqttService } from '../mqtt/mqtt.service';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ConversationService {
    constructor(
        @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => MessageService)) private messageService: MessageService,
        private readonly mqttService: MqttService,
        private readonly notificationService: NotificationService,
        private readonly eventGateway: EventsGateway,
    ) {}

    async create(users: string[], name: string, userId: string) {
        const uniqueUsersId = [];
        users.forEach((element) => {
            if (!uniqueUsersId.includes(element)) {
                uniqueUsersId.push(element);
            }
        });

        const usersObjectId = uniqueUsersId.map((item) => new mongoose.Types.ObjectId(item));

        try {
            const conversationExisted = await this.conversationModel.aggregate([
                {
                    $project: {
                        _id: 0,
                        sameParticipants: { $setEquals: ['$participants', usersObjectId] },
                        differentParticipants: { $setDifference: ['$participants', usersObjectId] },
                    },
                },
                {
                    $match: {
                        sameParticipants: true,
                        differentParticipants: { $eq: [] },
                    },
                },
            ]);

            if (conversationExisted.length > 0) {
                return handleResponse({
                    error: ERROR_EXISTED_CONVERSATION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            const conv = await this.conversationModel.create({
                participants: users,
                name,
                admin: users.length > 2 ? userId : undefined,
            });

            const conversation = await this.conversationModel
                .findById(conv._id, 'participants messages name admin')
                .populate('participants', 'name avatar')
                .populate('admin', 'name avatar');

            for (let i = 0; i < conversation.participants.length; i++) {
                const person = conversation.participants[i] as User;
                person.avatar = await this.cloudinaryService.getImageUrl(person.avatar);
            }

            (conversation.admin as UserDocument).avatar = await this.cloudinaryService.getImageUrl(
                (conversation.admin as UserDocument).avatar,
            );

            const receivers = users.filter((item) => item !== userId);

            for (const user of receivers) {
                const notify = await this.notificationService.create({
                    fromId: userId,
                    toId: user,
                    type: 'addMemberConv',
                    conversationId: conv._id,
                    conversationName: name,
                });

                const data = {
                    _id: conversation._id,
                    removedMember: conversation.removedMember,
                    name: conversation.name,
                    admin: conversation.admin,
                    participants: (conversation.participants as UserDocument[]).filter(
                        (pt) => pt._id.toString() !== user,
                    ),
                };

                this.eventGateway.sendNotify({ notify: notify.data, conversation: data }, user);
            }

            conversation.participants = (conversation.participants as UserDocument[]).filter(
                (pt) => pt._id.toString() !== userId,
            );

            return handleResponse({
                message: CREATE_CONVERSATION_SUCCESSFULLY,
                data: conversation,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_CONVERSATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async findById(id: string) {
        const conversation = await this.conversationModel.findById(id, undefined, { timestamps: true });
        return conversation;
    }

    async addMessage(conversationId, messageId) {
        try {
            await this.conversationModel.findOneAndUpdate(
                { _id: conversationId },
                {
                    $push: {
                        messages: {
                            $each: [messageId],
                            $position: 0,
                        },
                    },
                },
            );

            return true;
        } catch (error) {
            return handleResponse({
                error: ERROR_ADD_MESSAGE_TO_CONVERSATION,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async get(userId: string) {
        try {
            const conversations = (await this.conversationModel
                .find(
                    { participants: userId },
                    { _id: 1, participants: 1, removedMember: 1, name: 1, admin: 1, messages: { $slice: 1 } },
                )
                .populate('participants', { _id: 1, name: 1, avatar: 1 })
                .populate('removedMember', { _id: 1, name: 1, avatar: 1 })
                .populate('admin', { _id: 1, name: 1, avatar: 1 })
                .populate([
                    {
                        path: 'messages',
                        model: 'Message',
                        select: {
                            _id: 1,
                            message: { $slice: 1 },
                            sender: 1,
                            updatedAt: 1,
                        },
                        populate: {
                            path: 'message',
                            model: 'SubMessage',
                        },
                    },
                ])) as ConversationResDto[];

            conversations.sort((a, b) => {
                const timeB = b.messages.length > 0 ? new Date(b.messages[0].updatedAt.toString()).getTime() : 0;
                const timeA = a.messages.length > 0 ? new Date(a.messages[0].updatedAt.toString()).getTime() : 0;
                return timeB - timeA;
            });

            for (const conv of conversations) {
                const indexMe = conv.participants.findIndex((item) => item._id.toString() === userId);
                conv.participants.splice(indexMe, 1);

                for (const person of conv.participants) {
                    person.avatar = await this.cloudinaryService.getImageUrl(person.avatar);
                }

                for (const person of conv.removedMember) {
                    person.avatar = await this.cloudinaryService.getImageUrl(person.avatar);
                }

                if (conv.admin) {
                    conv.admin.avatar = await this.cloudinaryService.getImageUrl(conv.admin.avatar);
                }

                if (conv.messages.length > 0) {
                    if (conv.messages[0].message[0].messType === 'image') {
                        const urls: string[] = [];
                        for (const image of conv.messages[0].message[0].images) {
                            const url = await this.cloudinaryService.getImageUrl(image);
                            urls.push(url);
                        }
                        conv.messages[0].message[0].images = urls;
                    }
                }
            }

            return handleResponse({
                message: GET_CONVERSATIONS_SUCCESSFULLY,
                data: conversations,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_GET_CONVERSATIONS,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async rename(conversationId: string, name: string, userId: string) {
        try {
            const conv = await this.conversationModel.findById(conversationId);
            if (conv.admin.toString() !== userId) {
                return handleResponse({
                    error: ERROR_NOT_IS_CONV_ADMIN,
                    statusCode: HttpStatus.CONFLICT,
                });
            }

            await this.conversationModel.findByIdAndUpdate(conversationId, { name: name });
            return handleResponse({
                message: RENAME_CONVERSATION_SUCCESSFULLY,
            });
        } catch (error) {
            return handleResponse({
                error: ERROR_RENAME_CONVERSATION,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async switchAdmin(conversationId: string, newAdmin: string, oldAdmin: string) {
        try {
            const conv = await this.conversationModel.findById(conversationId);
            const user = await this.userService.findById(newAdmin);

            if (!user) {
                return handleResponse({
                    error: ERROR_USER_NOT_FOUND,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            if (conv.admin.toString() !== oldAdmin) {
                return handleResponse({
                    error: ERROR_NOT_HAVE_PERMISSION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            if (!conv.participants.map((item: any) => item.toString()).includes(newAdmin)) {
                return handleResponse({
                    error: ERROR_NEW_AMIN_NOT_IN_CONVERSATION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            conv.admin = newAdmin;
            await conv.save();

            return handleResponse({
                message: SWITCH_ADMIN_SUCCESSFULLY,
                data: {
                    conversationId,
                    newAdmin: {
                        _id: user._id,
                        name: user.name,
                        avatar: await this.cloudinaryService.getImageUrl(user.avatar),
                    },
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_SWITCH_ADMIN,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async removeMember(conversationId: string, userId: string, memberId: string) {
        try {
            if (memberId === userId) {
                return handleResponse({
                    error: ERROR_CANNOT_REMOVE_MYSEFF,
                    statusCode: HttpStatus.CONFLICT,
                });
            }

            const conv = await this.conversationModel.findById(conversationId);
            let participants = conv.participants.map((item: any) => item.toString()) as string[];

            if (!conv) {
                return handleResponse({
                    error: ERROR_NOT_FOUND_CONVERSATION,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            if (conv.admin.toString() !== userId) {
                return handleResponse({
                    error: ERROR_NOT_IS_CONV_ADMIN,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const indexMember = conv.participants.findIndex((item: any) => item.toString() === memberId);
            if (indexMember === -1) {
                return handleResponse({
                    error: ERROR_USER_NOT_IN_CONV,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const hadLeftBefore = conv.removedMember.findIndex((item: any) => item.toString() === memberId);
            if (hadLeftBefore > -1) {
                await this.conversationModel.findByIdAndUpdate(conversationId, {
                    $pull: { participants: new mongoose.Types.ObjectId(memberId) },
                });
            } else {
                await this.conversationModel.findByIdAndUpdate(conversationId, {
                    $pull: {
                        participants: new mongoose.Types.ObjectId(memberId),
                    },
                    $push: {
                        removedMember: new mongoose.Types.ObjectId(memberId),
                    },
                });
            }

            const systemMessage = await this.messageService.createSystemMessage(
                conversationId,
                'bị buộc rời nhóm',
                memberId,
                userId,
            );

            const data = {
                conversationId,
                member: memberId,
                message: systemMessage,
            };

            participants = participants.filter((item) => item !== userId);

            this.mqttService.sendMessageNotify(participants, data);

            const noti = await this.notificationService.create({
                fromId: userId,
                toId: memberId,
                type: 'removeMemberConv',
                conversationId: conversationId,
                conversationName: conv.name,
            });

            this.eventGateway.sendNotify({ notify: noti.data }, memberId);

            if (participants.length === 1) {
                await this.deleteConversation(conversationId);
            }

            return handleResponse({
                message: REMOVE_MEMBER_SUCCESSFULLY,
                data,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_CONVERSATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async leaveGroupChat(conversationId: string, userId: string) {
        try {
            const conv = await this.conversationModel.findById(conversationId);
            let participants = conv.participants.map((item: any) => item.toString()) as string[];

            if (!participants.includes(userId)) {
                return handleResponse({
                    error: ERROR_USER_NOT_IN_CONVERSATION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            if (conv.admin.toString() === userId) {
                return handleResponse({
                    error: ERROR_ADMIN_NOT_ALLOW_TO_LEAVE,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            const hadLeftBefore = conv.removedMember.findIndex((item: any) => item.toString() === userId);
            if (hadLeftBefore > -1) {
                await this.conversationModel.findByIdAndUpdate(conversationId, {
                    $pull: { participants: new mongoose.Types.ObjectId(userId) },
                });
            } else {
                await this.conversationModel.findByIdAndUpdate(conversationId, {
                    $pull: { participants: new mongoose.Types.ObjectId(userId) },
                    $push: {
                        removedMember: new mongoose.Types.ObjectId(userId),
                    },
                });
            }

            const systemMessage = await this.messageService.createSystemMessage(
                conversationId,
                'đã rời nhóm',
                userId,
                userId,
            );

            const data = {
                conversationId,
                member: userId,
                message: systemMessage,
            };

            participants = participants.filter((item) => item !== userId);

            this.mqttService.sendMessageNotify(participants, data);

            if (participants.length === 1) {
                await this.deleteConversation(conversationId);
            }

            return handleResponse({
                message: LEAVE_CONVERSATION_SUCCESSFULLY,
                data: {
                    conversationId,
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_LEAVE_CONVERSATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async addMember(conversationId: string, member: string, userId: string) {
        try {
            const user = await this.userService.findById(member);
            if (!user) {
                return handleResponse({
                    error: USER_NOT_EXISTED,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const conv = await this.conversationModel.findById(conversationId);
            const participants = conv.participants.map((item: any) => item.toString()) as string[];

            if (participants.includes(member)) {
                return handleResponse({
                    error: ERROR_USER_ALREADY_IN_CONVERSATION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            await this.conversationModel.findByIdAndUpdate(conversationId, {
                $push: { participants: new mongoose.Types.ObjectId(member) },
            });

            const systemMessage = await this.messageService.createSystemMessage(
                conversationId,
                'đã tham gia nhóm',
                member,
                userId,
            );

            const noti = await this.notificationService.create({
                fromId: userId,
                toId: member,
                type: 'addMemberConv',
                conversationId: conversationId,
                conversationName: conv.name,
            });

            this.eventGateway.sendNotify({ notify: noti.data }, member);

            const data = {
                conversationId,
                member: {
                    _id: user._id,
                    name: user.name,
                    avatar: await this.cloudinaryService.getImageUrl(user.avatar),
                },
                message: systemMessage,
            };

            this.mqttService.sendMessageNotify(
                participants.filter((item) => item !== userId),
                data,
            );

            return handleResponse({
                message: ADD_MEMBER_SUCCESSFULLY,
                data,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_ADD_MEMBER_TO_CONVERSATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async addMembers(conversationId: string, members: string[], userId: string) {
        try {
            const data = {
                conversationId,
                members: [],
                messages: [],
            };

            for (const member of members) {
                const result = await this.addMember(conversationId, member, userId);
                data.members.push(result.data.member);
                data.messages.unshift(result.data.message);
            }

            return handleResponse({
                message: ADD_MEMBER_SUCCESSFULLY,
                data,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_ADD_MEMBER_TO_CONVERSATION,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteConversation(conversationId: string) {
        try {
            const conv = await this.conversationModel.findById(conversationId);
            for (const message of conv.messages as string[]) {
                await this.messageService.deleteMessage(message);
            }

            await conv.delete();
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_CONVERSATION,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        }
    }
}
