import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CREATE_COMMENT_SUCCESS } from '../../constances';
import {
    ERROR_CREATE_EDUCATION,
    ERROR_GET_EDUCATIONS,
    GET_EDUCATIONS_SUCCESS,
} from '../../constances/educationResponseMessage';
import { handleResponse } from '../../dto/response';
import { EducationResDto } from '../../dto/response/education';
import { Education, EducationDocument } from '../../schemas';

@Injectable()
export class EducationService {
    constructor(
        @InjectModel(Education.name) private educationModel: Model<EducationDocument>,
        @InjectMapper() private readonly mapper: Mapper,
    ) {}

    async create(name: string) {
        try {
            const education = await this.educationModel.create({
                name: name,
            });

            return handleResponse({
                message: CREATE_COMMENT_SUCCESS,
                data: education,
            });
        } catch (error) {
            return handleResponse({
                error: ERROR_CREATE_EDUCATION,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getAll() {
        try {
            const educations = (await this.educationModel.find({})) as Education[];
            const result = this.mapper.mapArray(educations, Education, EducationResDto);
            return handleResponse({
                message: GET_EDUCATIONS_SUCCESS,
                data: result,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: ERROR_GET_EDUCATIONS,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
