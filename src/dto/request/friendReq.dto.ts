import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateFriendReqDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    @IsNotEmpty()
    toId: string;
}
