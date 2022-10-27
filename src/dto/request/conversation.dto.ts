import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsMongoId, IsNotEmptyObject, ValidateNested } from 'class-validator';
import { type } from 'os';

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
}
