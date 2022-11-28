import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateConversationDto, RenameConversationDto, EditConversationDto } from '../../dto/request/conversation.dto';
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
    renameConversation(@Body() dto: RenameConversationDto, @Req() req: Request) {
        return this.conversationService.rename(dto.conversationId, dto.name, (req.user as IJWTInfo)._id);
    }

    @Put('switch-admin')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    switchAdmin(@Body() dto: EditConversationDto, @Req() req: Request) {
        return this.conversationService.switchAdmin(dto.conversationId, dto.member, (req.user as IJWTInfo)._id);
    }

    @Delete(':conversationId/member/:memberId')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    removeMember(
        @Req() req: Request,
        @Param('conversationId') conversationId: string,
        @Param('memberId') memberId: string,
    ) {
        return this.conversationService.removeMember(conversationId, (req.user as IJWTInfo)._id, memberId);
    }

    @Put('leave-conversation/:id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    leaveConversation(@Param('id') id: string, @Req() req: Request) {
        return this.conversationService.leaveGroupChat(id, (req.user as IJWTInfo)._id);
    }

    @Put('add-member')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    addMember(@Body() dto: EditConversationDto) {
        return this.conversationService.addMember(dto.conversationId, dto.member);
    }
}
