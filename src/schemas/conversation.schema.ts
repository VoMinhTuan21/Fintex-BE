import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { MessageDocument } from './message.schema';
import { UserDocument } from './user.schema';

export type ConversationDocument = Conversation & Document & SchemaTimestampsConfig;

@Schema({
    timestamps: true,
})
export class Conversation {
    _id: string;

    @Prop([
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ])
    participants: UserDocument[] | string[];

    @Prop([
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
    ])
    messages: MessageDocument[] | string[];

    @Prop({ type: String, required: false })
    name: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
    admin: UserDocument | string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
