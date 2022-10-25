import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
    EDIT_USER_INFO_SUCCESSFULLY,
    ERROR_ADD_IMAGES_TO_ALBUM,
    ERROR_DELETE_IMAGES_IN_ALBUM,
    ERROR_DELETE_POST,
    ERROR_EDIT_USER_INFO,
    ERROR_GET_USER_PROFILE,
    ERROR_GET_ALBUMS,
    ERROR_NOT_FOUND,
    ERROR_UPDATE_AVATAR_COVER,
    GET_USER_PROFILE_SUCCESSFULLY,
    GET_ALBUM_SUCCESSFULLY,
    UPDATE_AVATAR_SUCCESSFULLY,
    UPDATE_COVER_SUCCESSFULLY,
} from '../../constances';
import { EditUserDto } from '../../dto/request/user.dto';
import { AlbumResDto, handleResponse, UserProfileResDto, UserResDto } from '../../dto/response';
import { User, UserDocument } from '../../schemas/user.schema';
import { PostIdWithUser } from '../../types/classes';
import { UpdateImage, VisibleFor } from '../../types/enums';
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

    async findUserPostIds(userId: string) {
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

    async editUser(dto: EditUserDto, userId: string) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                return handleResponse({
                    error: ERROR_NOT_FOUND,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            user.email = dto.email;
            user.name = dto.name;
            user.address = dto.address;
            user.birthday = dto.birthday;
            user.phone = dto.phone;
            user.education = dto.education;
            user.gender = dto.gender;

            user.save();

            const outcome = this.mapper.map(user, User, UserResDto);

            return handleResponse({
                message: EDIT_USER_INFO_SUCCESSFULLY,
                data: outcome,
            });
        } catch (error) {
            return handleResponse({
                error: ERROR_EDIT_USER_INFO,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async isAFriendToB(aId: string, bId: string) {
        const userA = await this.userModel.findById(aId);
        const index = userA.friends.findIndex((item: any) => item.toString() === bId.toString());
        if (index !== -1) {
            return true;
        }
        return false;
    }

    async getUserProfile(userId: string) {
        try {
            const user = await this.userModel.findById(userId).populate('education', 'name');
            user.avatar = await this.cloudinaryService.getImageUrl(user.avatar);
            user.coverPhoto = await this.cloudinaryService.getImageUrl(user.coverPhoto);

            return handleResponse({
                message: GET_USER_PROFILE_SUCCESSFULLY,
                data: this.mapper.map(user, User, UserProfileResDto),
            });
        } catch (error) {
            console.log('error: ', error);
            return handleResponse({
                error: error.response?.error || ERROR_GET_USER_PROFILE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getAlbums(userId: string) {
        return await this.userModel.findById(userId).select('friends');
    }

    async addAlbum(userId: string, album: IAlbum[]) {
        try {
            const user = await this.userModel.findById(userId);
            user.albums = album;
            await user.save();
        } catch (error) {
            console.log('error: ', error);
        }
    }

    async getPostIds(userId: string) {
        try {
            const user = await this.findById(userId);
            return user.posts;
        } catch (error) {
            console.log('error: ', error);
        }
    }

    async AddImagesToAlbum(userId: string, album: IAlbum[]) {
        try {
            const user = await this.findById(userId);
            user.albums.push(...album);
            await user.save();
        } catch (error) {
            return handleResponse({
                error: ERROR_ADD_IMAGES_TO_ALBUM,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async deleteImagesAlbum(userId: string, album: string[]) {
        try {
            const user = await this.findById(userId);
            for (const image of album) {
                const index = user.albums.findIndex((item) => item.publicId === image);
                user.albums.splice(index, 1);
            }

            await user.save();
        } catch (error) {
            return handleResponse({
                error: ERROR_DELETE_IMAGES_IN_ALBUM,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getAlbum(userId: string, type: 'me' | 'friend' | 'stranger', limit: number, after: string) {
        try {
            if (after !== 'end') {
                const user = await this.userModel.findById(userId);
                const album: AlbumResDto[] = [];
                let index = 0;
                let images: IAlbum[] = [];
                let imagesFilter: IAlbum[] = [];
                let newAfter = '';
                switch (type) {
                    case 'me':
                        if (after) {
                            index = user.albums.findIndex((item) => item.publicId === after);
                        }
                        images = user.albums.slice(index, index + limit);
                        newAfter = index + limit >= user.albums.length ? '' : user.albums[index + limit].publicId;

                        for (const image of images) {
                            const url = await this.cloudinaryService.getImageUrl(image.publicId);
                            album.push({
                                publicId: image.publicId,
                                url: url,
                            });
                        }
                        break;
                    case 'friend':
                        imagesFilter = user.albums.filter((item) => item.visibleFor !== VisibleFor.OnlyMe);
                        if (after) {
                            index = imagesFilter.findIndex((item) => item.publicId === after);
                        }
                        images = imagesFilter.slice(index, index + limit);
                        newAfter = index + limit >= imagesFilter.length ? '' : imagesFilter[index + limit].publicId;

                        for (const image of images) {
                            const url = await this.cloudinaryService.getImageUrl(image.publicId);
                            album.push({
                                publicId: image.publicId,
                                url: url,
                            });
                        }
                        break;
                    case 'stranger':
                        imagesFilter = user.albums.filter((item) => item.visibleFor === VisibleFor.Public);
                        if (after) {
                            index = imagesFilter.findIndex((item) => item.publicId === after);
                        }
                        images = imagesFilter.slice(index, index + limit);
                        newAfter = index + limit >= imagesFilter.length ? '' : imagesFilter[index + limit].publicId;
                        for (const image of images) {
                            if (image.visibleFor === VisibleFor.Public) {
                                const url = await this.cloudinaryService.getImageUrl(image.publicId);
                                album.push({
                                    publicId: image.publicId,
                                    url: url,
                                });
                            }
                        }
                        break;
                    default:
                        break;
                }

                return handleResponse({
                    message: GET_ALBUM_SUCCESSFULLY,
                    data: {
                        album: album,
                        after: newAfter,
                    },
                });
            }
        } catch (error) {
            return handleResponse({
                error: ERROR_GET_ALBUMS,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
