import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../../schemas';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PostModule } from '../post/post.module';
import { CommentController } from './comment.controler';
import { CommentService } from './comment.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]), PostModule, CloudinaryModule],
    controllers: [CommentController],
    providers: [CommentService],
})
export class CommentModule {}
