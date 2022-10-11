import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { GetStrangerDto } from '../../dto/request/user.dto';

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

    @Get('/strangers/:name?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getStragers(@Param('name') name: string, @Query() query: GetStrangerDto, @Req() req: Request) {
        return await this.userService.findByName(name, parseInt(query.limit), query.after, (req.user as IJWTInfo)._id);
    }
}
