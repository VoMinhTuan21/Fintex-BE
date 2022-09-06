import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthSignInWithPhoneDto, AuthSignUpDto, AuthVerifyUserDto, CheckUserWithPhoneDto } from '../../dto/request';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/sign-up')
    async signUp(@Body() authSignup: AuthSignUpDto) {
        return await this.authService.signUp(authSignup);
    }

    @Post('sign-in-with-phone')
    async signIn(@Body() authSignIn: AuthSignInWithPhoneDto) {
        return await this.authService.signInWithPhone(authSignIn);
    }

    @Post('verify-user')
    async verifyUser(@Body() dto: AuthVerifyUserDto) {
        return await this.authService.verfiyUser(dto);
    }

    @Post('/check-user-with-phone')
    async checkUserWithPhone(@Body() dto: CheckUserWithPhoneDto) {
        return await this.authService.checkUserWithPhone(dto);
    }
}
