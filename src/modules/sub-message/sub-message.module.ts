import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubMessage, SubMessageSchema } from '../../schemas/sub-message.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SubMessageController } from './sub-message.controller';
import { SubMessageService } from './sub-message.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: SubMessage.name, schema: SubMessageSchema }]), CloudinaryModule],
    controllers: [SubMessageController],
    providers: [SubMessageService],
    exports: [SubMessageService],
})
export class SubMessageModule {}
