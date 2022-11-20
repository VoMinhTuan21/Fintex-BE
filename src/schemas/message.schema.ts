import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { SubMessage, SubMessageDocument } from './sub-message.schema';
import { UserDocument } from './user.schema';

export type MessageDocument = Message & Document & SchemaTimestampsConfig;

@Schema({
    timestamps: true,
})
export class Message {
    _id: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    })
    sender: UserDocument | string;

    @Prop([
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubMessage',
        },
    ])
    message: SubMessageDocument[] | string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.pre('save', function () {
    this.set({ updatedAt: new Date() });
});
