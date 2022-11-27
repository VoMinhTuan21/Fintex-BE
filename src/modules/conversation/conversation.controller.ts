import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateConversationDto, RenameConversationDto, SwitchAdmin } from '../../dto/request/conversation.dto';
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

    @Put('rename-conversation')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    renameConversation(@Body() dto: RenameConversationDto) {
        return this.conversationService.rename(dto.conversationId, dto.name);
    }

    @Put('switch-admin')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    switchAdmin(@Body() dto: SwitchAdmin, @Req() req: Request) {
        return this.conversationService.switchAdmin(dto.conversationId, dto.newAdmin, (req.user as IJWTInfo)._id);
    }
}
