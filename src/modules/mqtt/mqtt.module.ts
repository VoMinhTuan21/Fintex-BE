import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';

@Module({
    controllers: [MqttController],
    providers: [
        {
            provide: 'MQTT_SERVICE',
            useFactory: (configService: ConfigService) => {
                const mqttBroker = configService.get<string>('MQTT_BROKER');
                return ClientProxyFactory.create({
                    transport: Transport.MQTT,
                    options: {
                        url: mqttBroker,
                    },
                });
            },
            inject: [ConfigService],
        },
        MqttService,
    ],
    exports: [MqttService],
})
export class MqttModule {}
