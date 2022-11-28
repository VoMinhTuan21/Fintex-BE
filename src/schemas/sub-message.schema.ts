import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { UserDocument } from './user.schema';

export type SubMessageDocument = SubMessage & Document;

@Schema()
export class SubMessage {
    _id: string;

    @Prop({ type: String, required: false })
    text: string;

    @Prop([{ type: String, required: false }])
    images: string[];

    @Prop({ type: String, enum: ['text', 'image', 'notify'] })
    messType: 'text' | 'image' | 'notify';

    @Prop([
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ])
    seen: UserDocument[] | string[];
}

export const SubMessageSchema = SchemaFactory.createForClass(SubMessage);
