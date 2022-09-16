import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

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
