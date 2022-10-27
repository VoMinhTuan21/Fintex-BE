import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendRequest, FriendRequestSchema } from '../../schemas/friend-request.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EventsGateway } from '../event/event.gateway';
import { EventModule } from '../event/event.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { FriendRequestController } from './friend-request.controller';
import { FriendRequestService } from './friend-request.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FriendRequest.name, schema: FriendRequestSchema }]),
        UserModule,
        EventModule,
        CloudinaryModule,
        NotificationModule,
    ],
    controllers: [FriendRequestController],
    providers: [FriendRequestService],
})
export class FriendRequestModule {}
