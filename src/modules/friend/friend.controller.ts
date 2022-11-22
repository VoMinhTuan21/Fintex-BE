import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { FriendService } from './friend.service';
import { Request } from 'express';

@ApiTags('friend')
@Controller('friend')
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @Delete(':id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async deleteFriend(@Param('id', ValidateMongoId) id: string, @Req() req: Request) {
        return this.friendService.deleteFriend((req.user as IJWTInfo)._id, id);
    }
}
