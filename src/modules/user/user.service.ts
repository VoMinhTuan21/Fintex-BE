import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { hashPasswords } from '../../utils';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(userSignup: IUserSignUp) {
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
    }

    async findByPhone(phone: string): Promise<UserDocument> {
        return await this.userModel.findOne({ phone: phone });
    }

    async findByEmail(email: string): Promise<UserDocument> {
        return await this.userModel.findOne({ email: email });
    }
}
