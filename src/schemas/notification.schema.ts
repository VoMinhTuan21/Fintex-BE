import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { PostDocument } from './post.schema';
import { UserDocument } from './user.schema';

export type NotificationDocument = Notification & Document;

@Schema({
    timestamps: true,
})
export class Notification {
    _id: string;

    @Prop({ type: String })
    type: string;

    @Prop({ type: String })
    content: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    })
    from: UserDocument | string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    })
    to: UserDocument | string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    })
    postId: PostDocument | string;

    @Prop({ type: Boolean, default: false })
    isSeen: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
