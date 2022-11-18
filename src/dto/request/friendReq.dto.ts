import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateFriendReqDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    toId: string;
}

export class FriendReqPaginationDto {
    @ApiPropertyOptional({ type: String })
    @IsNumberString()
    @IsNotEmpty()
    limit: string;

    @ApiPropertyOptional({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    @IsOptional()
    after: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    type: string;
}
