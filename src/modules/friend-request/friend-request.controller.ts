import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFriendReqDto } from '../../dto/request/friendReq.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { FriendRequestService } from './friend-request.service';
import { Request } from 'express';

@ApiTags('Friend request')
@Controller('friend-request')
export class FriendRequestController {
    constructor(private readonly friendReqService: FriendRequestService) {}

    @Post()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async create(@Req() req: Request, @Body() body: CreateFriendReqDto) {
        return await this.friendReqService.create((req.user as IJWTInfo)._id, body.toId);
    }

    @Get('/check-relationship/:toId')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async checkRelationship(@Req() req: Request, @Param('toId') toId: string) {
        return await this.friendReqService.checkRelationship((req.user as IJWTInfo)._id, toId);
    }
}
