import { FeelingDocument } from '../../schemas/feeling.schema';
import { VisibleFor } from '../../types/enums';
import { Image } from '../../types/classes';
import { ReactionDocument } from '../../schemas/reaction.schema';
import { UserDocument } from '../../schemas/user.schema';

export class PostResDto {
    _id: string;
    content: string;
    feeling: FeelingDocument;
    visibleFor: VisibleFor;
    images: Image[];
    reaction: {
        type: string;
        user: UserDocument;
    }[];
    createdAt: string;
}
