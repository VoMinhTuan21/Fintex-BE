import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { Gender } from '../../types/enums';
import { Name } from './auth.dto';

export class EditUserDto {
    @ApiProperty({ type: Name })
    @IsObject()
    @IsNotEmpty()
    name: Name;

    @ApiProperty({ type: String, format: 'date-time' })
    @IsString()
    @IsNotEmpty()
    birthday: string;

    @ApiProperty({ type: String, enum: Gender })
    @IsNotEmpty()
    gender: Gender;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsMongoId()
    education: string;
}
