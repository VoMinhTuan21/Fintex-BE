import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../schemas/conversation.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserModule } from '../user/user.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
        CloudinaryModule,
        UserModule,
    ],
    controllers: [ConversationController],
    providers: [ConversationService],
    exports: [ConversationService],
})
export class ConversationModule {}
