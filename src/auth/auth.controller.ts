import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthSignUpDto } from '../dto';
import { UserService } from '../user/user.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly userService: UserService) {}

    @Post('/sign-up')
    async signUp(@Body() authSignup: AuthSignUpDto) {
        return await this.userService.create(authSignup);
    }
}
