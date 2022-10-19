import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    ERROR_DELETE_POST,
    ERROR_UPDATE_AVATAR_COVER,
    UPDATE_AVATAR_SUCCESSFULLY,
    UPDATE_COVER_SUCCESSFULLY,
} from '../../constances';
import { handleResponse } from '../../dto/response';
import { User, UserDocument } from '../../schemas/user.schema';
import { PostIdWithUser } from '../../types/classes';
import { UpdateImage } from '../../types/enums';
import { hashPasswords } from '../../utils';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async create(userSignup: IUserSignUp) {
        const { birthday, email, gender, name, password, phone } = userSignup;

        const hashPass = hashPasswords(password);

        return await this.userModel.create({
            birthday,
            email,
            gender,
            avatar: process.env.PUBLIC_ID_DEFAULT_AVATAR,
            coverPhoto: process.env.PUBLIC_ID_DEFAULT_COVER_PHOTO,
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

    async findFriendsRecentPost(userId: string) {
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
                                    { $match: { visibleFor: { $in: ['public', 'friends'] } } },
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
                    'friends._id': 1,
                    'friends.posts': 1,
                    'friends.name': 1,
                    'friends.avatar': 1,
                },
            },
        ]);

        return this.mapPostWithUser(user[0].friends);
    }

    async findStrangerPostIds(userId: string) {
        try {
            const timeNow = new Date();
            timeNow.setDate(timeNow.getDate() - 7);

            const me = await this.userModel.findById(userId);
            const notStragerIds = [...me.friends, ...me.blocks, me._id];

            const strangerPostIds = await this.userModel.aggregate([
                {
                    $match: {
                        _id: { $nin: notStragerIds },
                    },
                },
                {
                    $lookup: {
                        from: 'posts',
                        localField: 'posts',
                        foreignField: '_id',
                        pipeline: [
                            { $match: { $expr: { $gt: ['$createdAt', timeNow] } } },
                            { $match: { $expr: { $eq: ['$visibleFor', 'public'] } } },
                            {
                                $project: {
                                    _id: 1,
                                },
                            },
                        ],
                        as: 'posts',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        posts: 1,
                        name: 1,
                        avatar: 1,
                    },
                },
            ]);

            return this.mapPostWithUser(strangerPostIds);
        } catch (error) {
            console.log('error: ', error);
        }
    }

    async findMyPostIds(userId: string) {
        return await this.userModel.findById(userId).select('avatar name posts');
    }

    async deletePost(userId: string, postId: string) {
        try {
            await this.userModel.findByIdAndUpdate(userId, {
                $pull: { posts: postId },
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_DELETE_POST,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async uploadAvatarCover(userId: string, imageFile: Express.Multer.File, typeUpdate: UpdateImage) {
        try {
            if (typeUpdate === UpdateImage.Avatar) {
                const { public_id, url } = await this.cloudinaryService.uploadImage(imageFile, 'avatar');

                await this.userModel.findByIdAndUpdate(userId, {
                    $set: {
                        avatar: public_id,
                    },
                });

                return handleResponse({
                    message: UPDATE_AVATAR_SUCCESSFULLY,
                    data: url,
                });
            }

            const { public_id, url } = await this.cloudinaryService.uploadImage(imageFile, 'cover');

            await this.userModel.findByIdAndUpdate(userId, {
                $set: {
                    coverPhoto: public_id,
                },
            });

            return handleResponse({
                message: UPDATE_COVER_SUCCESSFULLY,
                data: url,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_UPDATE_AVATAR_COVER,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    mapPostWithUser(arr: any[]) {
        const postIdWithUser: PostIdWithUser[] = [];
        arr.forEach((post) => {
            postIdWithUser.push({
                _id: post._id,
                avatar: post.avatar,
                name: post.name,
                posts: post.posts.map((item) => item._id),
            });
        });

        return postIdWithUser;
    }
}
