import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateConversationDto } from '../../dto/request/conversation.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { ConversationService } from './conversation.service';
import { Request } from 'express';

@ApiTags('Conversation')
@Controller('conversation')
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) {}

    @Post()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    create(@Body() dto: CreateConversationDto, @Req() req: Request) {
        const users = dto.users.map((item) => item.id);
        users.push((req.user as IJWTInfo)._id);
        const userId = (req.user as IJWTInfo)._id;
        return this.conversationService.create(users, dto.name, userId);
    }

    @Get()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    get(@Req() req: Request) {
        return this.conversationService.get((req.user as IJWTInfo)._id);
    }
}
