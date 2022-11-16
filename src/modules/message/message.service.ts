import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CREATE_MESSAGE_SUCCESSFULLY,
    ERROR_AFTER_NOT_FOUND,
    ERROR_CREATE_MESSAGE,
    ERROR_GET_PAGINATE_MESSAGES,
    ERROR_NOT_FOUND_CONVERSATION,
    ERROR_USER_NOT_IN_CONVERSATION,
    GET_MESSAGES_SUCCESSFULLY,
} from '../../constances';
import { CreateMessageDto } from '../../dto/request/message.dto';
import { handleResponse } from '../../dto/response';
import { Message, MessageDocument } from '../../schemas/message.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConversationService } from '../conversation/conversation.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly conversationService: ConversationService,
        private readonly mqttService: MqttService,
    ) {}

    async create(content: CreateMessageDto, senderId: string) {
        try {
            const conversation = await this.conversationService.findById(content.conversationId);
            if (!conversation) {
                return handleResponse({
                    error: ERROR_NOT_FOUND_CONVERSATION,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const indexUser = conversation.participants.findIndex((item: any) => item.toString() === senderId);
            if (indexUser === -1) {
                return handleResponse({
                    error: ERROR_USER_NOT_IN_CONVERSATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const receiverIds = conversation.participants as string[];
            receiverIds.splice(indexUser, 1);

            const idLastestMess = conversation.messages.length > 0 ? (conversation.messages[0] as string) : '';

            if (idLastestMess) {
                console.log('idLastestMess: ', idLastestMess);
                const lastestMess = await this.messageModel.findById(idLastestMess);
                const now = new Date();
                const lastesMessTime = new Date(lastestMess.createdAt.toString());

                console.log('now.getTime() - lastesMessTime.getTime() : ', now.getTime() - lastesMessTime.getTime());
                if (
                    lastestMess &&
                    now.getTime() - lastesMessTime.getTime() <= 120000 &&
                    lastestMess.sender.toString() === senderId
                ) {
                    if (content.type === 'image' && content.images) {
                        const publicIds: string[] = [];
                        for (const image of content.images) {
                            const { public_id } = await this.cloudinaryService.uploadImage(image, 'Fintex');
                            publicIds.push(public_id);
                        }

                        lastestMess.message.push({
                            images: publicIds,
                            messType: 'image',
                        });
                    } else if (content.type === 'text') {
                        lastestMess.message.push({
                            text: content.text,
                            messType: 'text',
                        });
                    }

                    await lastestMess.save();

                    const messageRes = {
                        _id: lastestMess._id,
                        sender: lastestMess.sender,
                        message: [lastestMess.message[lastestMess.message.length - 1]],
                        createdAt: lastestMess.createdAt,
                        conversationId: content.conversationId,
                    };

                    this.mqttService.sendMessage(receiverIds, messageRes);

                    return handleResponse({
                        message: CREATE_MESSAGE_SUCCESSFULLY,
                        data: messageRes,
                    });
                }
            }

            let message: MessageDocument;

            if (content.type === 'image' && content.images) {
                const publicIds: string[] = [];
                for (const image of content.images) {
                    const { public_id } = await this.cloudinaryService.uploadImage(image, 'Fintex');
                    publicIds.push(public_id);
                }

                message = await this.messageModel.create({
                    sender: senderId,
                    message: [
                        {
                            images: publicIds,
                            messType: 'image',
                        },
                    ],
                });
            } else if (content.type === 'text') {
                message = await this.messageModel.create({
                    sender: senderId,
                    message: [
                        {
                            text: content.text,
                            messType: 'text',
                        },
                    ],
                });
            }

            await this.conversationService.addMessage(content.conversationId, message._id);

            const messageRes = {
                _id: message._id,
                sender: message.sender,
                message: message.message,
                createdAt: message.createdAt,
                conversationId: content.conversationId,
            };

            this.mqttService.sendMessage(receiverIds, messageRes);

            return handleResponse({
                message: CREATE_MESSAGE_SUCCESSFULLY,
                data: messageRes,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_MESSAGE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async get(conversationId: string, limitTime: number, after: string, userId: string) {
        try {
            const conversation = await this.conversationService.findById(conversationId);
            if (!conversation) {
                return handleResponse({
                    error: ERROR_NOT_FOUND_CONVERSATION,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const indexUser = conversation.participants.findIndex((item: any) => item.toString() === userId);
            if (indexUser === -1) {
                return handleResponse({
                    error: ERROR_USER_NOT_IN_CONVERSATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            if (after !== 'end') {
                let index = 0;
                let messagesId: string[] = [];

                if (after) {
                    index = conversation.messages.findIndex((item: any) => item.toString() === after);
                    if (index === -1) {
                        return handleResponse({
                            error: ERROR_AFTER_NOT_FOUND,
                            statusCode: HttpStatus.NOT_FOUND,
                        });
                    }
                }

                messagesId = conversation.messages.slice(index) as string[];
                console.log('messagesId: ', messagesId);

                const firstMessage = await this.messageModel.findById(messagesId[0]);
                console.log('firstMessage._id: ', firstMessage._id);
                const firstMessTime = new Date(firstMessage.createdAt.toString());
                console.log('firstMessTime: ', firstMessTime.toISOString());
                const endTime = new Date(firstMessTime.getTime() - limitTime * 60 * 1000);

                const messages = await this.messageModel
                    .find(
                        {
                            _id: { $in: messagesId },
                            createdAt: { $gte: endTime },
                        },
                        { createdAt: 0, __v: 0 },
                    )
                    .sort({ updatedAt: -1 });

                console.log('messages.length: ', messages.length);

                const idLastMessage = messages[messages.length - 1]._id;
                const indexLastMessage = messagesId.findIndex((item) => item.toString() === idLastMessage.toString());
                console.log('indexLastMessage: ', indexLastMessage);

                for (const message of messages) {
                    for (const item of message.message) {
                        if (item.messType === 'image') {
                            const urls: string[] = [];
                            for (const image of item.images) {
                                const url = await this.cloudinaryService.getImageUrl(image);
                                urls.push(url);
                            }

                            item.images = urls;
                        }
                    }
                }

                return handleResponse({
                    message: GET_MESSAGES_SUCCESSFULLY,
                    data: {
                        messages: messages,
                        after:
                            indexLastMessage !== -1 && indexLastMessage < messagesId.length - 1
                                ? messagesId[indexLastMessage + 1]
                                : 'end',
                    },
                });
            } else {
                return handleResponse({
                    message: GET_MESSAGES_SUCCESSFULLY,
                    data: [],
                });
            }
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_GET_PAGINATE_MESSAGES,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getFirstTime(conversationId: string, userId: string) {
        try {
            const conversation = await this.conversationService.findById(conversationId);
            if (!conversation) {
                return handleResponse({
                    error: ERROR_NOT_FOUND_CONVERSATION,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const indexUser = conversation.participants.findIndex((item: any) => item.toString() === userId);
            if (indexUser === -1) {
                return handleResponse({
                    error: ERROR_USER_NOT_IN_CONVERSATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const messagesId = conversation.messages.slice(0, 20) as string[];
            const messages = await this.messageModel
                .find(
                    {
                        _id: { $in: messagesId },
                    },
                    { createdAt: 0, __v: 0 },
                )
                .sort({ updatedAt: -1 });

            for (const message of messages) {
                for (const item of message.message) {
                    if (item.messType === 'image') {
                        const urls: string[] = [];
                        for (const image of item.images) {
                            const url = await this.cloudinaryService.getImageUrl(image);
                            urls.push(url);
                        }

                        item.images = urls;
                    }
                }
            }

            return handleResponse({
                message: GET_MESSAGES_SUCCESSFULLY,
                data: {
                    messages: messages,
                    after: conversation.messages.length < 20 ? 'end' : conversation.messages[20],
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_GET_PAGINATE_MESSAGES,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
