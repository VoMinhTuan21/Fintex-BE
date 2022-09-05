import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EducationDocument = Education & Document;

@Schema({
    timestamps: true,
})
export class Education {
    _id: string;

    @Prop({
        type: String,
    })
    name: string;
}

export const EducationSchema = SchemaFactory.createForClass(Education);
