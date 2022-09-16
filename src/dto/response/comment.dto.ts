export class CommnentResDto {
    _id: string;
    postId: string;
    avatar: string;
    level: number;
    name: {
        firstName: string;
        lastName: string;
    };
    content: string;
    image: string;
    parentComment: string | null | undefined;
    commentsChildren: number;
    reaction: {
        title: string;
        userId: string;
    }[];
    createAt: string;
}
