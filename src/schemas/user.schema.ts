import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongodb';
import mongoose from 'mongoose';
import { Gender } from 'src/types';
import { EducationDocument } from './education.schema';
import { PostDocument } from './post.schema';

export type UserDocument = User & Document;

@Schema({
    timestamps: true,
})
export class User {
    _id: string;

    @Prop({
        type: {
            firstName: String,
            lastName: String,
        },
        required: true,
    })
    name: {
        firstName: string;
        lastName: string;
    };

    @Prop({
        type: String,
        enum: Gender,
    })
    gender: Gender;

    @Prop({
        type: String,
        unique: true,
        sparse: true,
        required: true,
    })
    phone: string;

    @Prop({
        type: String,
        unique: true,
        sparse: true,
        required: true,
    })
    email: string;

    @Prop({
        type: String,
    })
    address: string;

    @Prop({
        type: mongoose.Schema.Types.Date,
    })
    birthday: string;

    @Prop({
        type: String,
    })
    avatar: string;

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
    friends: UserDocument[] | string[];

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Education',
    })
    education: EducationDocument | string;

    @Prop({
        type: String,
    })
    bio: string;

    @Prop([{ type: String }])
    albums: string[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
    follower: UserDocument[] | string[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
    following: UserDocument[] | string[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
    blocks: UserDocument[] | string[];

    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }])
    post: PostDocument[] | string[];

    @Prop({
        type: Boolean,
    })
    isVerify: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
