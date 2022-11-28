import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../schemas/conversation.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EventModule } from '../event/event.module';
import { MessageModule } from '../message/message.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
        CloudinaryModule,
        UserModule,
        MqttModule,
        forwardRef(() => MessageModule),
        NotificationModule,
        EventModule,
    ],
    controllers: [ConversationController],
    providers: [ConversationService],
    exports: [ConversationService],
})
export class ConversationModule {}
