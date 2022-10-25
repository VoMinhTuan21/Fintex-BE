import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
    CreatePostDto,
    PostPaginationDto,
    ReactionPostDto,
    UpdateAvatarCoverPostDto,
    UpdatePostDto,
} from '../../dto/request/post.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { PostService } from './post.service';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../../utils';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Post')
@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Post()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string', nullable: true },
                visibleFor: { enum: ['public', 'friends', 'only me'] },
                feeling: { type: 'string', nullable: true },
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    nullable: true,
                },
            },
            required: ['visibleFor'],
        },
    })
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            fileFilter: imageFileFilter,
        }),
    )
    async create(
        @Req() req: Request,
        @Body() post: CreatePostDto,
        @UploadedFiles() images: Array<Express.Multer.File>,
    ) {
        return await this.postService.create((req.user as IJWTInfo)._id, post, images);
    }

    @Get('/post-for-pagination')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getPostsForPagination(@Req() req: Request) {
        return await this.postService.getPostsForPagination((req.user as IJWTInfo)._id);
    }

    @Get('/pagination?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getPaginationPosts(@Req() req: Request, @Query() paginate: PostPaginationDto) {
        return await this.postService.findPostPagination(
            (req.user as IJWTInfo)._id,
            parseInt(paginate.limit),
            paginate.after,
            'all',
        );
    }

    @Get('/mine/pagination?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getMinePaginationPosts(@Req() req: Request, @Query() paginate: PostPaginationDto) {
        return await this.postService.findPostPagination(
            (req.user as IJWTInfo)._id,
            parseInt(paginate.limit),
            paginate.after,
            'mine',
        );
    }

    @Get('/:personId/pagination?')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getPersonPaginationPosts(
        @Req() req: Request,
        @Query() paginate: PostPaginationDto,
        @Param('personId') personId: string,
    ) {
        return await this.postService.findPostPagination(
            (req.user as IJWTInfo)._id,
            parseInt(paginate.limit),
            paginate.after,
            'person',
            personId,
        );
    }

    // @Delete('/comment')
    // @ApiBearerAuth('access_token')
    // @UseGuards(JwtGuard)
    // async deleteComment(@Body() dto: DeleteCommentDto, @Req() req: Request) {
    //     return this.postService.deleteComment(dto.postId, dto.commentId, (req.user as IJWTInfo)._id);
    // }

    @Post('/reaction')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async reactionPost(@Body() dto: ReactionPostDto, @Req() req: Request) {
        return this.postService.reactionPost((req.user as IJWTInfo)._id, dto.postId, dto.type);
    }

    @Delete('/reaction/:postId')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async DeleteReactionPost(@Param('postId') postId: string, @Req() req: Request) {
        return this.postService.deleteReactionPost((req.user as IJWTInfo)._id, postId);
    }

    @Get('/my-posts-for-pagination')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getMyPostForPagination(@Req() req: Request) {
        return this.postService.getMyPostForPagination((req.user as IJWTInfo)._id);
    }

    @Put('/:id')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            fileFilter: imageFileFilter,
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdatePostDto })
    async updatePost(
        @Param('id') id: string,
        @Body() updatedPost: UpdatePostDto,
        @UploadedFiles() images: Array<Express.Multer.File>,
        @Req() req: Request,
    ) {
        return await this.postService.updatePost(id, updatedPost, images, (req.user as IJWTInfo)._id);
    }

    @Delete('/:postId')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async deletePost(@Param('postId', ValidateMongoId) postId: string, @Req() req: Request) {
        return this.postService.deletePost((req.user as IJWTInfo)._id, postId);
    }

    @Post('/avatar-cover')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async uploadAvatar(@Req() req: Request, @Body() body: UpdateAvatarCoverPostDto) {
        return this.postService.createAvatarCoverPost((req.user as IJWTInfo)._id, body.content, body.typeUpdate);
    }

    @Post('add-images-to-album/:userId')
    async addImagesToAlbum(@Param('userId') userId: string) {
        return await this.postService.addImagesToAlbum(userId);
    }
}
