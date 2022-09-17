import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ERROR_EMAIL_NOT_MATCH_WITH_ID_TOKEN,
    ERROR_CHECK_USER_WITH_GOOGLE,
    ERROR_CHECK_USER_WITH_PHONE,
    ERROR_CREATE_USER,
    ERROR_EMAIL_HAS_BEEN_USED,
    ERROR_PASSWORD_NOT_CORRECT,
    ERROR_PHONE_HAS_BEEN_USED,
    ERROR_SIGN_IN_WITH_PHONE,
    ERROR_USER_NOT_FOUND,
    ERROR_VERIFY_USER,
    SIGN_IN_SUCCESSFULLY,
    SIGN_UP_SUCCESSFULLY,
    USER_EXISTED,
    USER_NOT_EXISTED,
    ERROR_NOT_FOUND_CURRENT_USER,
    GET_CURRENT_USER_SUCCESSFULLY,
} from '../../constances';
import { handleResponse, UserResDto } from '../../dto/response';
import { UserService } from '../user/user.service';
import { comparePassword } from '../../utils';
import { Mapper } from '@automapper/core';
import { User } from '../../schemas/user.schema';
import { InjectMapper } from '@automapper/nestjs';
import { AuthVerifyUserDto, CheckUserWithPhoneDto } from '../../dto/request';
import * as firebase from 'firebase-admin';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ConfigService) private config: ConfigService,
        @InjectMapper() private readonly mapper: Mapper,
        private readonly userService: UserService,
        private jwtService: JwtService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async signInWithPhone(authSignIn: ISignInWithPhone) {
        try {
            const user = await this.userService.findByPhone(authSignIn.phone);
            if (!user) {
                return handleResponse({
                    error: ERROR_USER_NOT_FOUND,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            const isCorrectPass: boolean = await comparePassword(authSignIn.password, user.password);
            if (!isCorrectPass) {
                return handleResponse({
                    error: ERROR_PASSWORD_NOT_CORRECT,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            return handleResponse({
                message: SIGN_IN_SUCCESSFULLY,
                data: {
                    token: await this.signJWTToken(user._id, user.email, user.phone),
                    user: this.mapper.map(user, User, UserResDto),
                },
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_SIGN_IN_WITH_PHONE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async signUp(userSignup: IUserSignUp) {
        try {
            const userEmail = await this.userService.findByEmail(userSignup.email);
            if (userEmail) {
                return handleResponse({
                    error: ERROR_EMAIL_HAS_BEEN_USED,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const userPhone = await this.userService.findByPhone(userSignup.phone);
            if (userPhone) {
                return handleResponse({
                    error: ERROR_PHONE_HAS_BEEN_USED,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            const newUser = await this.userService.create(userSignup);
            if (!newUser) {
                return handleResponse({
                    error: ERROR_CREATE_USER,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

            newUser.avatar = await this.cloudinaryService.getImageUrl(newUser.avatar);

            return handleResponse({
                message: SIGN_UP_SUCCESSFULLY,
                data: {
                    token: await this.signJWTToken(newUser._id, newUser.email, newUser.phone),
                    user: this.mapper.map(newUser, User, UserResDto),
                },
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CREATE_USER,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    private async signJWTToken(_id: string, email: string, phone: string): Promise<string> {
        const secret: string = this.config.get('JWT_SECRET');
        const payload: IJWTInfo = {
            _id,
            email,
            phone,
        };
        return this.jwtService.signAsync(payload, {
            expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
            secret,
        });
    }

    async verfiyUser(dto: AuthVerifyUserDto) {
        try {
            const userEmail = (await firebase.auth().verifyIdToken(dto.idToken)).email;

            if (userEmail !== dto.user.email) {
                return handleResponse({
                    error: ERROR_EMAIL_NOT_MATCH_WITH_ID_TOKEN,
                    statusCode: HttpStatus.NOT_ACCEPTABLE,
                });
            }

            const user = await this.userService.findByEmail(userEmail);
            if (user) {
                return handleResponse({
                    message: USER_EXISTED,
                    data: {
                        isExisted: true,
                        phone: user.phone,
                    },
                });
            } else {
                return handleResponse({
                    message: USER_NOT_EXISTED,
                    data: {
                        isExisted: false,
                    },
                });
            }
        } catch (error) {
            console.log(error);
            return handleResponse({
                error: error.response?.error || ERROR_VERIFY_USER,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async checkUserWithPhone(dto: CheckUserWithPhoneDto) {
        try {
            const user = await this.userService.findByPhone(dto.phone);

            if (user) {
                return handleResponse({
                    message: USER_EXISTED,
                    data: {
                        isExisted: true,
                    },
                });
            } else {
                return handleResponse({
                    message: USER_NOT_EXISTED,
                    data: {
                        isExisted: false,
                    },
                });
            }
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CHECK_USER_WITH_PHONE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async signInWithGoogle(dto: CheckUserWithPhoneDto) {
        try {
            const user = await this.userService.findByPhone(dto.phone);

            user.avatar = await this.cloudinaryService.getImageUrl(user.avatar);

            if (user) {
                return handleResponse({
                    message: SIGN_IN_SUCCESSFULLY,
                    data: {
                        token: await this.signJWTToken(user._id, user.email, user.phone),
                        user: this.mapper.map(user, User, UserResDto),
                    },
                });
            }
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CHECK_USER_WITH_GOOGLE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }

    async getCurrentUser(id: string) {
        try {
            const currUser = await this.userService.findById(id);
            if (!currUser) {
                return handleResponse({
                    error: ERROR_NOT_FOUND_CURRENT_USER,
                    statusCode: HttpStatus.NOT_FOUND,
                });
            }

            currUser.avatar = await this.cloudinaryService.getImageUrl(currUser.avatar);

            return handleResponse({
                message: GET_CURRENT_USER_SUCCESSFULLY,
                data: {
                    token: await this.signJWTToken(currUser._id, currUser.email, currUser.phone),
                    user: this.mapper.map(currUser, User, UserResDto),
                },
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_CHECK_USER_WITH_GOOGLE,
                statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
            });
        }
    }
}
