import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MqttService {
    constructor(@Inject('MQTT_SERVICE') private client: ClientProxy) {}

    sendMessage(userIds: string[], message: any) {
        for (const userId of userIds) {
            this.client.emit(`${userId}/chat`, JSON.stringify(message));
        }
    }

    seenMessage(userIds: string[], message: any) {
        for (const userId of userIds) {
            this.client.emit(`${userId}/chat/seen-message`, JSON.stringify(message));
        }
    }

    sendMessageNotify(userIds: string[], message: any) {
        for (const userId of userIds) {
            this.client.emit(`${userId}/chat/system-message`, JSON.stringify(message));
        }
    }
}
