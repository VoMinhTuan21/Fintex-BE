import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UpdateImage } from '../../types/enums';

export class UpdateAvatarCoverDto {
    @ApiProperty({ enum: UpdateImage })
    @IsEnum(UpdateImage)
    @IsNotEmpty()
    typeUpdate: UpdateImage;
}
