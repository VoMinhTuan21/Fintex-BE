import { Body, Controller, Get, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreatePostDto, PostPaginationDto } from '../../dto/request/post.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { PostService } from './post.service';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../../utils';

@ApiTags('Post')
@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Post()
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
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

    // @Get('/pagination?')
    // @ApiBearerAuth('access_token')
    // @UseGuards(JwtGuard)
    // async getPaginationPosts(@Req() req: Request, @Query() paginate: PostPaginationDto) {
    //     return await this.postService.findPostPagination(
    //         (req.user as IJWTInfo)._id,
    //         parseInt(paginate.limit),
    //         paginate.after,
    //     );
    // }
}
