import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { match } from 'assert';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { IResponsePost } from '../../types/post';
import { comparePost, hashPasswords } from '../../utils';

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

    async findById(id: string): Promise<UserDocument> {
        return await this.userModel.findById(id);
    }

    async addPost(userId: string, postId: string) {
        return await this.userModel.findByIdAndUpdate(
            userId,
            {
                $push: {
                    posts: postId,
                },
            },
            { new: true },
        );
    }

    async findExceptPost(userId: string): Promise<string[]> {
        const exceptPost: string[] = [];
        const user = await (
            await this.userModel.findById(userId).select('blocks posts -_id')
        ).populate('blocks', 'posts -_id');

        exceptPost.push(...user.posts);
        for (let i = 0; i < user.blocks.length; i++) {
            exceptPost.push(...user.blocks[i].posts);
        }

        return exceptPost;
    }

    async findFriendsRecentPost(userId: string): Promise<string[]> {
        const timeNow = new Date();
        timeNow.setDate(timeNow.getDate() - 2);

        const user = await this.userModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'friends',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'posts',
                                localField: 'posts',
                                foreignField: '_id',
                                pipeline: [
                                    { $match: { $expr: { $gt: ['$createdAt', timeNow] } } },
                                    {
                                        $project: {
                                            _id: 1,
                                        },
                                    },
                                ],
                                as: 'posts',
                            },
                        },
                    ],
                    as: 'friends',
                },
            },
            {
                $project: {
                    'friends.posts': 1,
                },
            },
        ]);

        const friendsRecentPosts: string[] = [];

        for (let i = 0; i < user[0].friends.length; i++) {
            friendsRecentPosts.push(...user[0].friends[i].posts);
        }

        return friendsRecentPosts;
    }
}
