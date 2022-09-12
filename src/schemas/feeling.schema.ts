import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeelingDocument = Feeling & Document;

@Schema({
    timestamps: true,
})
export class Feeling {
    _id: string;

    @Prop({
        type: String,
        unique: true,
    })
    name: string;

    @Prop({
        type: String,
    })
    emoji: string;
}

export const FeelingSchema = SchemaFactory.createForClass(Feeling);
