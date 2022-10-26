import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { EventsGateway } from './event.gateway';

@Module({
    imports: [JwtModule, UserModule],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class EventModule {}
