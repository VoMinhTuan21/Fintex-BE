import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FriendReqDto } from '../../dto/response/friend-req.dto';
import { handleFriendOnline } from '../../utils/socket';
import { UserService } from '../user/user.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'notifications',
})
export class EventsGateway {
    constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}

    @WebSocketServer()
    server: Server;
    onlineUsers: OnlineUser[] = [];

    getUserIdFromJWT(client: Socket) {
        if (client.handshake.headers.authorization && client.handshake.headers.authorization.split(' ')[1] !== 'null') {
            return this.jwtService.verify(client.handshake.headers.authorization.split(' ')[1], {
                secret: process.env.JWT_SECRET,
            })._id;
        }
        return null;
    }

    sendFriendReq(data: FriendReqDto, sendTo: string) {
        // return some thing like
        // {
        //     friendReq: {....}
        //     typeSocket: 'notify'
        // }
        this.server.emit(sendTo, { friendReq: data, typeSocket: 'friendReq' });
    }

    sendNotify(data: any, sendTo: string) {
        // return some thing like
        // {
        //     notify: {....}
        //     typeSocket: 'notify'
        //     friendReqId?: 'abcd'
        // }
        this.server.emit(sendTo, { ...data, typeSocket: 'notify' });
    }

    async handleConnection(client: Socket) {
        const userId = this.getUserIdFromJWT(client);
        if (userId) {
            console.log('connected');
            console.log('userId: ', userId);
            const index = this.onlineUsers.findIndex((item) => item._id.toString() === userId.toString());
            if (index === -1) {
                const user = await this.userService.getSimpleInfo(userId);
                this.onlineUsers.push(user);
            }
            // console.log('onlineUsers: ', this.onlineUsers);

            const friendIds = await this.userService.getFriendIds(userId);
            const onlineFriends = handleFriendOnline(this.onlineUsers, friendIds);
            const currUser = this.onlineUsers.find((user) => user._id.toString() === userId.toString());

            //send notification to friends of current user to add them on online friend
            onlineFriends.forEach((friendId) => {
                this.server.emit(friendId._id.toString(), { onlineFriends: [currUser], typeSocket: 'friendsOnline' });
            });

            // send notification to current user when he/her first login with his/her online friends
            this.server.emit(userId, { onlineFriends, typeSocket: 'friendsOnline' });
            this.server.emit(userId, 'you connected to socket server');
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = this.getUserIdFromJWT(client);
        if (userId) {
            console.log('disconnected');
            console.log('userId: ', userId);
            const index = this.onlineUsers.findIndex((item) => item._id.toString() === userId.toString());
            if (index >= 0) {
                this.onlineUsers.splice(index, 1);
            }

            const friendIds = await this.userService.getFriendIds(userId);
            const onlineFriends = handleFriendOnline(this.onlineUsers, friendIds);

            // send notification to all friends is online that current user has just offlined
            onlineFriends.forEach((friendId) => {
                this.server.emit(friendId._id.toString(), { offlineUser: userId, typeSocket: 'friendOffline' });
            });
        }
    }
}
