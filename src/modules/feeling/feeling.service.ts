import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CREATE_FEELING_SUCCESSFULLY,
    DELETE_FEELING_SUCCESSFULLY,
    ERROR_CREATE_FEELING,
    ERROR_DELETE_FEELING,
    ERROR_FEELING_IS_EXISTED,
    ERROR_FIND_ALL_FEELING,
    ERROR_UPDATE_FEELING,
    FIND_ALL_FEELING_SUCCESSFULLY,
    UPDATE_FEELING_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { Feeling, FeelingDocument } from '../../schemas/feeling.schema';
import { IFeeling, IFeelingUpdate } from '../../types/post';
import { Image } from '../../types/classes';

@Injectable()
export class FeelingService {
    constructor(@InjectModel(Feeling.name) private feelingModel: Model<FeelingDocument>) {}

    async create(feeling: IFeeling) {
        try {
            const existFeeling = await this.feelingModel.findOne({ name: feeling.name });
            if (existFeeling) {
                return handleResponse({
                    error: ERROR_FEELING_IS_EXISTED,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const newFeeling = await this.feelingModel.create({
                name: feeling.name,
                emoji: feeling.emoji,
            });

            if (!newFeeling) {
                return handleResponse({
                    error: ERROR_CREATE_FEELING,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            return handleResponse({
                message: CREATE_FEELING_SUCCESSFULLY,
                data: newFeeling,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_UPDATE_FEELING,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async update(id: string, feeling: IFeelingUpdate) {
        try {
            const existFeeling = await this.feelingModel.findOne({ name: feeling.name, _id: { $ne: id } });
            if (existFeeling) {
                return handleResponse({
                    error: ERROR_FEELING_IS_EXISTED,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const updateFeeling = await this.feelingModel.findById(id);
            if (feeling.name) {
                updateFeeling.name = feeling.name;
            }
            if (feeling.emoji) {
                updateFeeling.emoji = feeling.emoji;
            }

            await updateFeeling.save();

            return handleResponse({
                message: UPDATE_FEELING_SUCCESSFULLY,
                data: updateFeeling,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_FEELING,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async findAll() {
        try {
            const feelings = await this.feelingModel.find();
            return handleResponse({
                message: FIND_ALL_FEELING_SUCCESSFULLY,
                data: feelings,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_FIND_ALL_FEELING,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async delete(id: string) {
        try {
            await this.feelingModel.findByIdAndRemove(id);
            return handleResponse({
                message: DELETE_FEELING_SUCCESSFULLY,
                data: id,
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_FEELING,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
