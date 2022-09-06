import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
