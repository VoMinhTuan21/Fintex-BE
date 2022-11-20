import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString } from 'class-validator';
import { Gender, UpdateImage } from '../../types/enums';
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

export class UpdateAvatarCoverDto {
    @ApiProperty({ enum: UpdateImage })
    @IsEnum(UpdateImage)
    @IsNotEmpty()
    typeUpdate: UpdateImage;
}

export class AlbumParamPagination {
    @ApiPropertyOptional({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limit: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    after: string;
}

export class FriendPaginationDto {
    @ApiProperty({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limit: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    after: string;
}
