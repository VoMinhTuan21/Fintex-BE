import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { VisibleFor } from '../types/enums';
import { FeelingDocument } from './feeling.schema';
import { ReactionDocument } from './reaction.schema';
import { UserDocument } from './user.schema';
import { Image } from '../types/classes';
import { CommentDocument } from './comment.schema';

export type PostDocument = Post & Document;

@Schema({
    timestamps: true,
})
export class Post {
    _id: string;

    @Prop({
        type: String,
    })
    content: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feeling',
    })
    feeling: FeelingDocument | string;

    @Prop({
        type: String,
        enum: VisibleFor,
    })
    visibleFor: VisibleFor;

    @Prop([{ type: Image }])
    images: Image[];

    @Prop([{ type: String }])
    videos: string[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }])
    comments: CommentDocument[] | string[];

    @Prop({
        type: [
            {
                type: { type: mongoose.Schema.Types.ObjectId, ref: 'Reaction' },
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
    })
    reaction: {
        type: ReactionDocument | string;
        userId: UserDocument | string;
    }[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
