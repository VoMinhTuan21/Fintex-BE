export class Image {
    publicId: string;
    orientation: 'horizontal' | 'vertical';
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
