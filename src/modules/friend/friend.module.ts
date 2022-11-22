import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { EventModule } from '../event/event.module';

@Module({
    imports: [UserModule, NotificationModule, EventModule],
    providers: [FriendService],
    controllers: [FriendController],
})
export class FriendModule {}
