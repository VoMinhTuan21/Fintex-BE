import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { NotificationService } from './notification.service';
import { Request } from 'express';
import { arrMongoIdDto, CreateNotiDto, NotifyPaginationDto } from '../../dto/request/notify.dto';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
    constructor(private readonly notiService: NotificationService) {}

    @Post()
    // @ApiBearerAuth('access_token')
    // @UseGuards(JwtGuard)
    async create(@Req() req: Request, @Body() body: CreateNotiDto) {
        return await this.notiService.create(body);
    }

    @Get()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getNotifyForPagination(@Req() req: Request) {
        return await this.notiService.getNotifyForPagination((req.user as IJWTInfo)._id);
    }

    @Get('/pagination?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getNotifyPagination(@Req() req: Request, @Query() paginate: NotifyPaginationDto) {
        return await this.notiService.getNotifyPagination(
            (req.user as IJWTInfo)._id,
            parseInt(paginate.limit),
            paginate.after,
        );
    }

    @Put('/see-notify')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async handleSeeNotify(@Body() body: arrMongoIdDto) {
        return await this.notiService.handleSeeNofify(body.arrId);
    }
}
