import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumberString,
    IsObject,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { Gender } from '../../types/enums';

export class Name {
    @ApiProperty({ type: String, default: 'Võ' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ type: String, default: 'Xuân Tú' })
    @IsString()
    @IsNotEmpty()
    lastName: string;
}

export class AuthSignUpDto {
    @ApiProperty({ type: Name })
    @IsNotEmpty()
    @IsObject()
    name: Name;

    @ApiProperty({ type: String, default: 'voxuantucntt@gmail.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    @Length(10)
    @Matches(/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/, { message: 'Malformed phone number' })
    phone: string;

    @ApiProperty({ type: String, default: '123456789' })
    @IsNotEmpty()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
        message:
            'Password must contain at least 1 letter, 1 number, 1 special character, and be at least 8 characters long',
    })
    password: string;

    @ApiProperty({ enum: Gender, default: Gender.Female })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ type: String, default: '2001-01-01' })
    @IsDateString()
    @IsNotEmpty()
    birthday: string;
}

export class AuthSignInWithPhoneDto {
    @ApiProperty({ type: String, default: '0988835462' })
    @IsNumberString()
    @IsNotEmpty()
    @Length(10)
    @Matches(/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/, { message: 'Malformed phone number' })
    phone: string;

    @ApiProperty({ type: String, default: 'voxuantu@8121' })
    @IsNotEmpty()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
        message:
            'Password must contain at least 1 letter, 1 number, 1 special character, and be at least 8 characters long',
    })
    password: string;
}

export class AuthVerifyUserDto {
    @ApiProperty({ type: Object })
    @IsNotEmpty()
    user: {
        name: string;
        phone: string;
        avatar: string;
        email: string;
    };
    @ApiProperty({ type: String })
    @IsNotEmpty()
    idToken: string;
}

export class CheckUserWithPhoneDto {
    @ApiProperty({ type: String })
    @IsNotEmpty()
    phone: string;
}
