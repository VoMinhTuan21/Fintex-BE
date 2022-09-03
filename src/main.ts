import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initSwagger } from './config/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.enableCors();
    initSwagger(app);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    const SWAGGER_API_SERVER = config.get<string>('SWAGGER_API_SERVER');
    const PORT = config.get<string>('PORT');
    await app.listen(PORT);
    console.log(`Server is running on: ${SWAGGER_API_SERVER}`);
}
bootstrap();
