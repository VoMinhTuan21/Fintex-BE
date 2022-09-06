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
