import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { EditUserDto } from '../../dto/request/user.dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/except-post')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getExceptPost(@Req() req: Request) {
        return await this.userService.findExceptPost((req.user as IJWTInfo)._id);
    }

    @Get('/friends-recent-posts')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getFriendsRecentPosts(@Req() req: Request) {
        return await this.userService.findFriendsRecentPost((req.user as IJWTInfo)._id);
    }

    @Get('/strangers-recent-posts')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getStrangersRecentPosts(@Req() req: Request) {
        return await this.userService.findStrangerPostIds((req.user as IJWTInfo)._id);
    }

    @Put('/edit-info')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async editInfo(@Body() dto: EditUserDto, @Req() req: Request) {
        return await this.userService.editUser(dto, (req.user as IJWTInfo)._id);
    }
}
