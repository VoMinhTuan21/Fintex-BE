import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from '../../dto/request';
import { imageFileFilter } from '../../utils';
import { UpdateAvatarCoverDto } from '../../dto/request/user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/except-post')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getExceptPost(@Req() req: Request) {
        return await this.userService.findExceptPost((req.user as IJWTInfo)._id);
    }

    @Get('/friends-recent-posts')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getFriendsRecentPosts(@Req() req: Request) {
        return await this.userService.findFriendsRecentPost((req.user as IJWTInfo)._id);
    }

    @Get('/strangers-recent-posts')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    async getStrangersRecentPosts(@Req() req: Request) {
        return await this.userService.findStrangerPostIds((req.user as IJWTInfo)._id);
    }

    @Post('/avatar-cover')
    @ApiBearerAuth('access_token')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
                typeUpdate: { enum: ['avatar', 'cover'] },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: imageFileFilter,
        }),
    )
    async uploadAvatar(
        @Req() req: Request,
        @UploadedFile() image: Express.Multer.File,
        @Body() body: UpdateAvatarCoverDto,
    ) {
        return this.userService.uploadAvatar((req.user as IJWTInfo)._id, image, body.typeUpdate);
    }
}
