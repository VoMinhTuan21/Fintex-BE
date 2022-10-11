import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { GET_STRANGERS_ERROR, GET_STRANGERS_SUCCESS } from '../../constances';
import { handleResponse, StrangerDto, StrangerPagination } from '../../dto/response';
import { User, UserDocument } from '../../schemas/user.schema';
import { PostIdWithUser } from '../../types/classes';
import { Stranger } from '../../types/classes/user';
import { hashPasswords } from '../../utils';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectMapper() private readonly mapper: Mapper,
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

    async findByName(name: string, limit: number, after: string, userId: string) {
        try {
            const source = await this.userModel.find(
                { 'name.fullName': { $regex: name, $options: 'i' }, _id: { $ne: new mongoose.Types.ObjectId(userId) } },
                { _id: 1, name: { fullName: 1 }, avatar: 1, address: 1 },
            );

            const users = this.mapper.mapArray(source, Stranger, StrangerDto);

            const result: StrangerDto[] = [];
            let newAfter = '';

            if (after) {
                const index = users.findIndex((item) => item._id.toString() === after);
                result.push(...users.slice(index, index + limit));
                newAfter = index + limit >= users.length ? '' : users[index + limit]._id;
            } else {
                result.push(...users.slice(0, limit));
                newAfter = limit >= users.length ? '' : users[limit]._id;
            }

            const friendsId = (await this.userModel.findById(userId)).friends;

            for (const user of result) {
                user.avatar = await this.cloudinaryService.getImageUrl(user.avatar);
                const index = friendsId.findIndex((item: any) => item.equals(user._id));

                if (index >= 0) {
                    user.isFriend = true;
                }
            }

            const outcome: StrangerPagination = {
                data: result,
                after: newAfter,
            };

            return handleResponse({
                message: GET_STRANGERS_SUCCESS,
                data: outcome,
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: GET_STRANGERS_ERROR,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
