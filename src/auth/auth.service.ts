import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ERROR_CREATE_USER,
    ERROR_PASSWORD_NOT_CORRECT,
    ERROR_SIGN_IN_WITH_PHONE,
    ERROR_USER_NOT_FOUND,
    SIGN_IN_SUCCESSFULLY,
    SIGN_UP_SUCCESSFULLY,
} from '../constances';
import { handleResponse, UserResDto } from '../dto/response';
import { UserService } from '../user/user.service';
import { comparePassword } from '../utils';
import { Mapper } from '@automapper/core';
import { User } from '../schemas/user.schema';
import { InjectMapper } from '@automapper/nestjs';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ConfigService) private config: ConfigService,
        @InjectMapper() private readonly mapper: Mapper,
        private readonly userService: UserService,
        private jwtService: JwtService,
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
            const newUser = await this.userService.create(userSignup);
            if (!newUser) {
                return handleResponse({
                    error: ERROR_CREATE_USER,
                    statusCode: HttpStatus.BAD_REQUEST,
                });
            }

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
}
