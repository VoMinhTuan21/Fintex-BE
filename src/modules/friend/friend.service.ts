import { HttpStatus, Injectable } from '@nestjs/common';
import { DELETE_FRIEND_SUCCESSULLY, ERROR_DELETE_FRIEND } from '../../constances';
import { handleResponse } from '../../dto/response';
import { EventsGateway } from '../event/event.gateway';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class FriendService {
    constructor(
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly eventGateway: EventsGateway,
    ) {}

    async deleteFriend(userId: string, friendId: string) {
        try {
            await this.userService.deleteFriends(userId, friendId);

            const noti = await this.notificationService.create({
                fromId: userId,
                toId: friendId,
                type: 'deleteFriend',
            });

            this.eventGateway.sendNotify({ notify: noti.data }, friendId);

            return handleResponse({
                message: DELETE_FRIEND_SUCCESSULLY,
            });
        } catch (error) {
            return handleResponse({
                error: ERROR_DELETE_FRIEND,
                statusCode: HttpStatus.BAD_REQUEST,
            });
        }
    }
}
