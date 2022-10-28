import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentSchema, Comment } from '../../schemas/comment.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EventModule } from '../event/event.module';
import { NotificationModule } from '../notification/notification.module';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';
import { CommentController } from './comment.controler';
import { CommentService } from './comment.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
        PostModule,
        CloudinaryModule,
        UserModule,
        NotificationModule,
        EventModule,
    ],
    controllers: [CommentController],
    providers: [CommentService],
})
export class CommentModule {}
