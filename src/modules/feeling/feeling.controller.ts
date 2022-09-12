import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFeelingDto, UpdateFeelingDto } from '../../dto/request/post.dto';
import { FeelingService } from './feeling.service';

@ApiTags('Feeling')
@Controller('feeling')
export class FeelingController {
    constructor(private readonly feelingService: FeelingService) {}

    @Get()
    async findAll() {
        return await this.feelingService.findAll();
    }

    @Post()
    async create(@Body() feeling: CreateFeelingDto) {
        return await this.feelingService.create(feeling);
    }

    @Put('/:id')
    async update(@Param('id') id: string, @Body() feeling: UpdateFeelingDto) {
        return await this.feelingService.update(id, feeling);
    }

    @Delete('/:id')
    async delete(@Param('id') id: string) {
        return await this.feelingService.delete(id);
    }
}
