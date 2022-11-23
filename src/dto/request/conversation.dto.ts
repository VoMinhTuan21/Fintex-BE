import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsMongoId,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

class UserConv {
    @IsMongoId()
    id: string;
}

export class CreateConversationDto {
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
    @Type(() => UserConv)
    users: UserConv[];

    @ApiProperty({ type: String })
    @IsOptional()
    @IsString()
    name?: string;
}
