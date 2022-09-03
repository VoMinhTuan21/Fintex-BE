import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `env/.env.${process.env.NODE_ENV || 'local'}`,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('local', 'development', 'production').default('local'),
            }),
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
