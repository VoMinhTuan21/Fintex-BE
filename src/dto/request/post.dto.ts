import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VisibleFor } from '../../types/enums';
import { Orientation } from '../../types/enums/orientation';

export class CreateFeelingDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    emoji: string;
}

export class UpdateFeelingDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    emoji: string;
}

export class ImageDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    url: string;

    @ApiProperty({ enum: Orientation })
    @IsEnum(Orientation)
    @IsNotEmpty()
    orientation: Orientation;
}

export class CreatePostDto {
    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    content?: string;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsMongoId()
    @IsNotEmpty()
    feeling?: string;

    @ApiProperty({ enum: VisibleFor, default: VisibleFor.Public })
    @IsEnum(VisibleFor)
    @IsNotEmpty()
    visibleFor: VisibleFor;
}
