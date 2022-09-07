import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthSignInWithPhoneDto, AuthSignUpDto, AuthVerifyUserDto, CheckUserWithPhoneDto } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
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

    @Post('sign-in-with-google')
    async signInWithGoogle(@Body() dto: CheckUserWithPhoneDto) {
        return await this.authService.signInWithGoogle(dto);
    }

    @Get('/current-user')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getCurrentUser(@Req() req: Request) {
        return await this.authService.getCurrentUser((req.user as IJWTInfo)._id);
    }
}
