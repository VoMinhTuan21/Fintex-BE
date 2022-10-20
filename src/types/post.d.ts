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

declare interface IUpdatePost {
    content?: string;
    feeling?: string;
    visibleFor: VisibleFor;
    deletedImages: boolean;
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
}

declare interface IPostReaction {
    type: string;
    user: IUserReaction;
}

declare interface IResPost {
    _id: string;
    content: string;
    feeling: IFeeling;
    visibleFor: VisibleFor;
    images: {
        publicId: string;
        orientation: Orientation;
    }[];
    reactions: IPostReaction[];
    comments: string[];
    createdAt: string;
    postType: string;
}

declare interface ICommentsIdPaginate {
    commentsId: string[];
    after: string;
    ended: boolean;
}
