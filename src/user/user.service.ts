import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_CREATE_USER } from '../constances';
import { handleResponse } from '../dto/response';
import { User, UserDocument } from '../schemas/user.schema';
import { hashPasswords } from '../utils';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(userSignup: IUserSignUp) {
        try {
            const { birthday, email, gender, name, password, phone } = userSignup;
            const hashPass = hashPasswords(password);

            return await this.userModel.create({
                birthday,
                email,
                gender,
                name,
                password: hashPass,
                phone,
            });
        } catch (error) {
            console.log('error: ', error);

            return handleResponse({
                error: error.response?.error || ERROR_CREATE_USER,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async findByPhone(phone: string): Promise<UserDocument> {
        return await this.userModel.findOne({ phone: phone });
    }
}
