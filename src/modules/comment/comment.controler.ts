import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
    CreateCommentDto,
    DeleteCommentDto,
    GetParentCommentsDto,
    ReactionCommentDto,
    UpdateCommentDto,
} from '../../dto/request';
import { handleResponse } from '../../dto/response';
import { JwtGuard } from '../../guards/jwt.guard';
import { imageFileFilter } from '../../utils';
import { CommentService } from './comment.service';
import { Request } from 'express';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Comment')
@Controller('comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: imageFileFilter,
        }),
    )
    @ApiBody({
        type: CreateCommentDto,
    })
    @Post()
    create(@Body() dto: CreateCommentDto, @UploadedFile() image: Express.Multer.File, @Req() req: Request) {
        if (!dto.content && !dto.image) {
            return handleResponse({
                error: 'Expect field content or image',
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }

        if (image) {
            dto.image = image;
        }

        return this.commentService.create(dto, (req.user as IJWTInfo)._id);
    }

    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: imageFileFilter,
        }),
    )
    @ApiBody({
        type: UpdateCommentDto,
    })
    @Put()
    update(@Body() dto: UpdateCommentDto, @UploadedFile() image: Express.Multer.File, @Req() req: Request) {
        if (!dto.content && !dto.image && !dto.oldImage) {
            return handleResponse({
                error: 'Expect field content or image or oldImage',
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }

        if (image) {
            dto.image = image;
        }

        return this.commentService.update(dto, (req.user as IJWTInfo)._id);
    }

    @Get('/:postId?')
    getParentComments(@Param('postId', ValidateMongoId) postId: string, @Query() query: GetParentCommentsDto) {
        return this.commentService.getCommentParent(postId, parseInt(query.limit), query.after);
    }

    @Get('/:postId/:parentId?')
    getChildComments(
        @Param('postId', ValidateMongoId) postId: string,
        @Param('parentId', ValidateMongoId) parentId: string,
        @Query() query: GetParentCommentsDto,
    ) {
        return this.commentService.getCommentChildren(postId, parentId, parseInt(query.limit), query.after);
    }

    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @Post('/reaction')
    reaction(@Body() dto: ReactionCommentDto, @Req() req: Request) {
        return this.commentService.reaction(dto.commentId, dto.type, (req.user as IJWTInfo)._id);
    }

    @Delete('/all-comments-of-post/:id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    deleteAllCommentsOfPost(@Param('id', ValidateMongoId) id: string) {
        return this.commentService.deleteAllCommentOfPost(id);
    }

    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @Delete(':commentId/:postId')
    delete(
        @Param('commentId', ValidateMongoId) commentId: string,
        @Param('postId', ValidateMongoId) postId: string,
        @Req() req: Request,
    ) {
        return this.commentService.delete(commentId, (req.user as IJWTInfo)._id, postId);
    }
}
