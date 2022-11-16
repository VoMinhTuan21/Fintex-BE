import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../../schemas/message.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ConversationModule } from '../conversation/conversation.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        ConversationModule,
        CloudinaryModule,
        MqttModule,
    ],
    controllers: [MessageController],
    providers: [MessageService],
})
export class MessageModule {}
