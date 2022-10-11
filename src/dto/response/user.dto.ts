import { Gender } from '../../types/enums';

export class UserResDto {
    _id: string;
    name: {
        firstName: string;
        lastName: string;
    };
    email: string;
    phone: string;
    avatar: string;
    birthday: string;
    gender: Gender;
}

export class StrangerDto {
    _id: string;
    fullName: string;
    avatar: string;
    address: string;
    isFriend: boolean;
}

export class StrangerPagination {
    data: StrangerDto[];
    after: string;
}
