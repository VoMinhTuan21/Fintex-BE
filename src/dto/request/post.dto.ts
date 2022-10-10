import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
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

export class PostPaginationDto {
    @ApiPropertyOptional({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limit: string;

    @ApiPropertyOptional({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    @IsOptional()
    after: string;
}

export class DeleteCommentDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    postId: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    commentId: string;
}

export class ReactionPostDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    postId: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    type: string;
}

export class DeleteReactionPostDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    postId: string;
}

export class FormPostDto {
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

    @ApiPropertyOptional({
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
        nullable: true,
    })
    images?: Array<Express.Multer.File>;
}

export class UpdatePostDto extends FormPostDto {
    @ApiProperty({ type: Boolean })
    @Transform(({ value }) => {
        return value === 'true' || value === true || value === 1 || value === '1';
    })
    @IsBoolean()
    deletedImages: boolean;
}
