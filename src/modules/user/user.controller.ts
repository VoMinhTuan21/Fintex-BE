import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';

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
        console.log((req.user as IJWTInfo)._id);
        return await this.userService.findFriendsRecentPost((req.user as IJWTInfo)._id);
    }
}
