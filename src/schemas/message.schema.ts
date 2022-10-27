import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
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
            type: {
                text: {
                    type: String,
                    required: false,
                },
                images: {
                    type: [String],
                    required: false,
                },
                messType: {
                    type: String,
                    enum: ['text', 'image'],
                },
            },
            required: true,
        },
    ])
    message: {
        text?: string;
        images?: string[];
        messType: 'text' | 'image';
    }[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
