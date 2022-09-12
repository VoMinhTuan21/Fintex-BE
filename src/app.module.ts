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
        UserModule,
        AuthModule,
        FeelingModule,
        PostModule,
        CloudinaryModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
