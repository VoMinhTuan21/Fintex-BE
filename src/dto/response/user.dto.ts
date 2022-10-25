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

export class AlbumResDto {
    publicId: string;
    url: string;
}
export class UserProfileResDto {
    _id: string;
    name: {
        firstName: string;
        lastName: string;
    };
    avatar: string;
    coverPhoto: string;
    birthday: string;
    gender: Gender;
    education: string;
    address: string;
}
