import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    ERROR_EXISTED_CONVERSATION,
    CREATE_CONVERSATION_SUCCESSFULLY,
    ERROR_CREATE_CONVERSATION,
    ERROR_ADD_MESSAGE_TO_CONVERSATION,
    GET_CONVERSATIONS_SUCCESSFULLY,
    ERROR_GET_CONVERSATIONS,
} from '../../constances/conversationResponseMessage';
import { CreateConversationDto } from '../../dto/request/conversation.dto';
import { handleResponse } from '../../dto/response';
import { ConversationResDto } from '../../dto/response/conversation.dto';
import { Conversation, ConversationDocument } from '../../schemas/conversation.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ConversationService {
    constructor(
        @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async create(users: string[]) {
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
                        // differentParticipants: { $setDifference: ['$participants', usersObjectId] },
                    },
                },
                {
                    $match: {
                        sameParticipants: true,
                        // differentParticipants: { $eq: [] },
                    },
                },
            ]);

            if (conversationExisted.length > 0) {
                return handleResponse({
                    error: ERROR_EXISTED_CONVERSATION,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            const conversation = await this.conversationModel.create({
                participants: users,
            });

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
                .find({ participants: userId }, { _id: 1, participants: 1, messages: { $slice: 1 } })
                .populate('participants', { _id: 1, name: 1, avatar: 1 })
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
            // .populate('messages', {
            //     _id: 1,
            //     message: { $slice: 1 },
            //     sender: 1,
            //     updatedAt: 1,
            // })) as ConversationResDto[];

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
}
