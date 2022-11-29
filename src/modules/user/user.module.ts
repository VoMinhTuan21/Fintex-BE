import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ConversationModule } from '../conversation/conversation.module';
import { EventModule } from '../event/event.module';
import { NotificationModule } from '../notification/notification.module';
import { UserController } from './user.controller';
import { UserProfile } from './user.profile';
import { UserService } from './user.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), CloudinaryModule],
    controllers: [UserController],
    providers: [UserService, UserProfile],
    exports: [UserService],
})
export class UserModule {}
