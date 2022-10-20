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
    coverPhoto: string;
    birthday: string;
    gender: Gender;
    education: string;
    address: string;
}
