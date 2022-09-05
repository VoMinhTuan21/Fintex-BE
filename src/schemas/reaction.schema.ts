import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReactionDocument = Reaction & Document;

@Schema({
    timestamps: true,
})
export class Reaction {
    _id: string;

    @Prop({
        type: String,
    })
    name: string;

    @Prop({
        type: String,
    })
    icon: string;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
