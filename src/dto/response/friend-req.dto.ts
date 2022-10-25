export class FriendReqDto {
    _id: string;
    user: {
        _id: string;
        name: {
            firstName: string;
            lastName: string;
        };
        avatar: string;
    };
}
