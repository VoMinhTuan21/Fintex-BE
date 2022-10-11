import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class GetStrangerDto {
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
