import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { ReactionEnum } from '../../constances';

export class CreateCommentDto {
    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    content?: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    postId: string;

    @ApiPropertyOptional({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    @IsOptional()
    parentId: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    @IsNotEmpty()
    @IsOptional()
    image?: Express.Multer.File;
}

export class UpdateCommentDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    oldImage?: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    @IsNotEmpty()
    @IsOptional()
    image?: Express.Multer.File;
}

export class GetParentCommentsDto {
    @ApiProperty({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limit: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    @IsMongoId()
    after: string;
}

export class DeleteCommentDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    postId: string;
}

export class ReactionCommentDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    commentId: string;

    @ApiProperty({ type: String, enum: ReactionEnum })
    @IsString()
    @IsNotEmpty()
    type: string;
}
