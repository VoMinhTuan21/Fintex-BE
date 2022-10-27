import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateMessageDto, PaginateMessageDto } from '../../dto/request/message.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { imageFileFilter } from '../../utils';
import { MessageService } from './message.service';
import { Request } from 'express';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Message')
@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @Post()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            fileFilter: imageFileFilter,
        }),
    )
    @ApiBody({ type: CreateMessageDto })
    create(@Body() dto: CreateMessageDto, @UploadedFiles() images: Array<Express.Multer.File>, @Req() req: Request) {
        if (images && images.length > 0) {
            dto.images = images;
        }

        return this.messageService.create(dto, (req.user as IJWTInfo)._id);
    }

    @Get('/:conversationId?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    get(
        @Param('conversationId', ValidateMongoId) conversationId: string,
        @Query() query: PaginateMessageDto,
        @Req() req: Request,
    ) {
        return this.messageService.get(
            conversationId,
            parseInt(query.limitTime),
            query.after,
            (req.user as IJWTInfo)._id,
        );
    }
}
