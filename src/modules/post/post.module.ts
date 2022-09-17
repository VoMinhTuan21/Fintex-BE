import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '../../schemas/post.schema';
import { UserModule } from '../user/user.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PostProfile } from './post.profile';
import { FeelingModule } from '../feeling/feeling.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
        UserModule,
        FeelingModule,
        CloudinaryModule,
    ],
    providers: [PostService, PostProfile],
    controllers: [PostController],
    exports: [PostService],
})
export class PostModule {}
