import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthSignInWithPhoneDto, AuthSignUpDto } from '../dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

    @Post('/sign-up')
    async signUp(@Body() authSignup: AuthSignUpDto) {
        return await this.userService.create(authSignup);
    }

    @Post('sign-in-with-phone')
    async signIn(@Body() authSignIn: AuthSignInWithPhoneDto) {
        return await this.authService.signInWithPhone(authSignIn);
    }
}
