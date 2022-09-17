import { Orientation } from '../enums/orientation';

export class Image {
    publicId: string;
    orientation: Orientation;
}

export class PostIdWithUser {
    _id: string;
    name: {
        firstName: string;
        lastName: string;
    };
    posts: string[];
    avatar: string;
}
