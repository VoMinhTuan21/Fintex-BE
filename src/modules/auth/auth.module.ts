import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { UserProfile } from '../user/user.profile';

@Module({
    imports: [UserModule, JwtModule],
    providers: [AuthService, UserProfile],
    controllers: [AuthController],
})
export class AuthModule {}
