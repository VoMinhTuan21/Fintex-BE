import { Module } from '@nestjs/common';
import { FeelingService } from './feeling.service';
import { FeelingController } from './feeling.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Feeling, FeelingSchema } from '../../schemas/feeling.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Feeling.name, schema: FeelingSchema }])],
    providers: [FeelingService],
    controllers: [FeelingController],
    exports: [FeelingService],
})
export class FeelingModule {}
