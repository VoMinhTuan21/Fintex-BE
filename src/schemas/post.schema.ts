import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ReactionDocument } from './reaction.schema';
import { UserDocument } from './user.schema';

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

    @Prop([{ type: String }])
    images: string[];

    @Prop([{ type: String }])
    videos: string[];

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
