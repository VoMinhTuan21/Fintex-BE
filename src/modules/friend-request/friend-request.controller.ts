import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFriendReqDto, FriendReqPaginationDto } from '../../dto/request/friendReq.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { FriendRequestService } from './friend-request.service';
import { Request } from 'express';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { GetStrangerDto } from '../../dto/request/user.dto';

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

    @Get('/receive-friend-req')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getFriendReqForPagination(@Req() req: Request) {
        return await this.friendReqService.getReceiveFriendReqForPagination((req.user as IJWTInfo)._id);
    }

    @Get('/receive-friend-req-pagination?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getFriendReqPagination(@Req() req: Request, @Query() paginate: FriendReqPaginationDto) {
        return await this.friendReqService.getReceiveFriendReqPagination(
            (req.user as IJWTInfo)._id,
            parseInt(paginate.limit),
            paginate.after,
        );
    }

    @Delete('/accept/:id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async acceptFriendReq(@Param('id', ValidateMongoId) id: string) {
        return await this.friendReqService.acceptFriendReq(id);
    }

    @Delete('/:id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async deleteFriendReq(@Param('id', ValidateMongoId) id: string) {
        return await this.friendReqService.deleteFriendReq(id);
    }

    @Get('/strangers/:name?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getStragers(@Param('name') name: string, @Query() query: GetStrangerDto, @Req() req: Request) {
        return await this.friendReqService.findUserByName(
            (req.user as IJWTInfo)._id,
            name,
            parseInt(query.limit),
            query.after,
        );
    }
}
