import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ERROR_PASSWORD_NOT_CORRECT,
    ERROR_SIGN_IN_WITH_PHONE,
    ERROR_USER_NOT_FOUND,
    SIGN_IN_SUCCESSFULLY,
} from '../constances';
import { handleResponse } from '../dto/response';
import { UserService } from '../user/user.service';
import { comparePassword } from '../utils';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ConfigService) private config: ConfigService,
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
                    user,
                },
            });
        } catch (error) {
            return handleResponse({
                error: error.response?.error || ERROR_SIGN_IN_WITH_PHONE,
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
