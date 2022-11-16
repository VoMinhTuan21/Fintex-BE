import { Controller } from '@nestjs/common';

@Controller('mqtt')
export class MqttController {
    // constructor(private readonly mqttService: MqttService) {}
    // @MessagePattern('notification_channel')
    // getNotifications(@Payload() data) {
    //     console.log('Client data in getNotifications: ', data);
    //     return `I Got Message From Client: ${data}`;
    // }
    // @MessagePattern('process_channel')
    // getProcessClientData(@Payload() data) {
    //     console.log('Client data in getProcessClientData for process', data);
    //     const result = data.split('');
    //     return result;
    // }
    // @Post('notifications')
    // getNotificationsController(@Body() dto: TestMqtt) {
    //     console.log('dto: ', dto);
    //     // this.mqttService.sendMessage(dto.userId);
    //     return 'success';
    // }
    // @Get('process')
    // getProcessClientDataController() {
    //     return this.client.send('process_channel', 'Mohammad Yaser Ahmadi');
    // }
}
