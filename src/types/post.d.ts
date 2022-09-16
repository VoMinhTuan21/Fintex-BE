import { VisibleFor } from './enums';
import { Orientation } from './enums/orientation';

declare interface IFeeling {
    name: string;
    emoji: string;
}

declare interface IFeelingUpdate {
    name?: string;
    emoji?: string;
}

declare interface ICreatePost {
    content?: string;
    feeling?: string;
    visibleFor: VisibleFor;
}

declare interface IImage {
    url: string;
    orientation: Orientation;
}

declare interface IReaction {
    _id: string;
    name: string;
    icon: string;
}

declare interface IUserReaction {
    _id: string;
    name: IName;
    avatar: string;
}

declare interface IPostReaction {
    type: IReaction;
    user: IUserReaction;
}

declare interface IResponsePost {
    _id: string;
    content: string;
    feeling: IFeeling;
    visibleFor: VisibleFor;
    images: IImage[];
    reaction: IPostReaction[];
    createdAt: string;
}

declare interface ICommentsIdPaginate {
    commentsId: string[];
    after: string;
    ended: boolean;
}
