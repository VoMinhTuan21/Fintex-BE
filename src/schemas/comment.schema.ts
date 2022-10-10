import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { UserDocument } from './user.schema';

export type CommentDocument = Comment & Document;

@Schema({
    timestamps: true,
})
export class Comment {
    _id: string;

    @Prop({
        type: String,
    })
    content: string;

    @Prop({
        type: Number,
    })
    level: number;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    })
    parentId: CommentDocument | string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    })
    userId: UserDocument | string;

    @Prop({ type: String })
    image: string;

    @Prop({
        type: [
            {
                type: { type: String },
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
    })
    reaction: {
        type: string;
        userId: UserDocument | string;
    }[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
