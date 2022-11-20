import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { initFireBase } from './config/firebase';
import { initSwagger } from './config/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.enableCors();
    app.setGlobalPrefix('api/v1');

    initSwagger(app);

    initFireBase(config);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    const SWAGGER_API_SERVER = config.get<string>('SWAGGER_API_SERVER');
    const PORT = config.get<string>('PORT');
    await app.listen(PORT);
    const mqtt = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.MQTT,
        options: {
            // url: 'mqtt://broker.emqx.io:1883',
            url: config.get<string>('MQTT_BROKER'),
        },
    });
    mqtt.listen();
    console.log(`[⚡Server] Server is running on: ${SWAGGER_API_SERVER}/api/v1`);
    console.log(`[⚡Server] Swagger is running on: ${SWAGGER_API_SERVER}/swagger`);
}
bootstrap();
