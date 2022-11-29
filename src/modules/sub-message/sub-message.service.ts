import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    CREATE_SUBMESSAGE_SUCCESS,
    ERROR_CREATE_SUBMESSAGE,
    ERROR_SAW_SUBMESSAGE,
} from '../../constances/subMessResponseMessage';
import { handleResponse } from '../../dto/response';
import { SubMessage, SubMessageDocument } from '../../schemas/sub-message.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SubMessageService {
    constructor(
        @InjectModel(SubMessage.name) private subMessageModel: Model<SubMessageDocument>,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async create(messType: string, text?: string, images?: string[], userId?: string) {
        try {
            const subMess = (await this.subMessageModel.create({
                text,
                images,
                messType,
                seen: userId ? [new mongoose.Types.ObjectId(userId)] : [],
            })) as SubMessage;

            if (messType === 'image') {
                const images: string[] = [];
                for (const img of subMess.images as string[]) {
                    const url = await this.cloudinaryService.getImageUrl(img);
                    images.push(url);
                }
                subMess.images = images;
            }

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
