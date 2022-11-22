import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../schemas/conversation.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]), CloudinaryModule],
    controllers: [ConversationController],
    providers: [ConversationService],
    exports: [ConversationService],
})
export class ConversationModule {}
