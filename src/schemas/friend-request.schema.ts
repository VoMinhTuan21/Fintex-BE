import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UserDocument } from './user.schema';

export type FriendRequestDocument = FriendRequest & Document;

@Schema({
    timestamps: true,
})
export class FriendRequest {
    _id: string;

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
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
