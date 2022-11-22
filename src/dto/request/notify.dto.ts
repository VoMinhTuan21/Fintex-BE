import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsMongoId,
    IsOptional,
    IsString,
    IsNumberString,
    ArrayNotEmpty,
    IsArray,
    ValidateNested,
} from 'class-validator';

export class CreateNotiDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    fromId: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    toId: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    @IsOptional()
    postId: string;
}

export class NotifyPaginationDto {
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

class idMongo {
    @IsMongoId()
    id: string;
}

export class arrMongoIdDto {
    @ApiProperty({
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                },
            },
        },
    })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => idMongo)
    arrId: idMongo[];
}
