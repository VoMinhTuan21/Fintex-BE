import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { FeelingModule } from './modules/feeling/feeling.module';
import { PostModule } from './modules/post/post.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { CommentModule } from './modules/comment/comment.module';
import { EducationModule } from './modules/education/education.module';
import { FriendRequestModule } from './modules/friend-request/friend-request.module';
import { EventModule } from './modules/event/event.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { MessageModule } from './modules/message/message.module';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { MqttService } from './modules/mqtt/mqtt.service';

@Module({
    imports: [
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `env/.env.${process.env.NODE_ENV || 'local'}`,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('local', 'development', 'production').default('local'),
            }),
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (cfg: ConfigService) => ({
                uri: cfg.get('MONGODB_URI'),
                useNewUrlParser: true,
            }),
            inject: [ConfigService],
        }),
        // ClientsModule.registerAsync([
        //     {
        //         name: 'MQTT_SERVICE',
        //         inject: [ConfigService],
        //         useFactory: (configService: ConfigService) => ({
        //             transport: Transport.MQTT,
        //             options: {
        //                 url: configService.get<string>('MQTT_BROKER'),
        //             },
        //         }),
        //     },
        // ]),
        UserModule,
        AuthModule,
        FeelingModule,
        PostModule,
        CommentModule,
        CloudinaryModule,
        EducationModule,
        FriendRequestModule,
        EventModule,
        NotificationModule,
        ConversationModule,
        MessageModule,
        MqttModule,
    ],
    controllers: [],
    providers: [
        // {
        //     provide: 'MQTT_SERVICE',
        //     useFactory: (configService: ConfigService) => {
        //         const mqttBroker = configService.get<string>('MQTT_BROKER');
        //         return ClientProxyFactory.create({
        //             transport: Transport.MQTT,
        //             options: {
        //                 url: mqttBroker,
        //             },
        //         });
        //     },
        //     inject: [ConfigService],
        // },
    ],
})
export class AppModule {}
