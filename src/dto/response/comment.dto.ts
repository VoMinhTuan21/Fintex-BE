import { ReactionEnum } from '../../constances';

export class CommnentResDto {
    _id: string;
    postId: string;
    avatar: string;
    level: number;
    userId: string;
    name: {
        firstName: string;
        lastName: string;
    };
    content: string;
    image: string;
    parentId: string | null | undefined;
    commentsChildren: number;
    reaction: {
        type: ReactionEnum;
        userId?: string;
        user: {
            _id: string;
            name: {
                firstName: string;
                lastName: string;
            };
        };
    }[];
    createAt: string;
}

export class CreateCommentResDto {
    comment: CommnentResDto;
    after: string;
}

export class ReactionCommentResDto {
    commentId: string;
    type: ReactionEnum;
    user: {
        _id: string;
        name: IName;
    };
}
