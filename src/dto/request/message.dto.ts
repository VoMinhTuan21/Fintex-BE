import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { type } from 'os';

export class CreateMessageDto {
    @ApiProperty({ type: 'string' })
    @IsMongoId()
    @IsNotEmpty()
    conversationId: string;

    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    text?: string;

    @ApiProperty({
        type: 'string',
        enum: ['text', 'image'],
    })
    @IsNotEmpty()
    @IsString()
    @IsEnum(['text', 'image'])
    type: 'text' | 'image';

    @ApiPropertyOptional({
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
    })
    images: Express.Multer.File[];
}

export class PaginateMessageDto {
    @ApiProperty({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limitTime: string;

    @ApiPropertyOptional({ type: String })
    @IsNotEmpty()
    @IsOptional()
    @IsMongoId()
    after: string;
}

export class SeenMessageDto {
    @ApiProperty({ type: 'string' })
    @IsMongoId()
    @IsNotEmpty()
    conversationId: string;
}
