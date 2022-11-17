import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CREATE_SUBMESSAGE_SUCCESS,
    ERROR_CREATE_SUBMESSAGE,
    ERROR_SAW_SUBMESSAGE,
} from '../../constances/subMessResponseMessage';
import { handleResponse } from '../../dto/response';
import { SubMessage, SubMessageDocument } from '../../schemas/sub-message.schema';

@Injectable()
export class SubMessageService {
    constructor(@InjectModel(SubMessage.name) private subMessageModel: Model<SubMessageDocument>) {}

    async create(messType: string, text?: string, images?: string[]) {
        try {
            const subMess = await this.subMessageModel.create({
                text,
                images,
                messType,
            });
            return handleResponse({
                message: CREATE_SUBMESSAGE_SUCCESS,
                data: subMess,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_CREATE_SUBMESSAGE,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async saw(subMessageId: string, userId: string) {
        try {
            await this.subMessageModel.findByIdAndUpdate(subMessageId, {
                $push: {
                    seen: userId,
                },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_SAW_SUBMESSAGE,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
