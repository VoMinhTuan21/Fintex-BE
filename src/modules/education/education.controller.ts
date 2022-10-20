import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateEducationDto } from '../../dto/request/education.dto';
import { EducationService } from './education.service';

@ApiTags('Education')
@Controller('education')
export class EducationController {
    constructor(private readonly educationService: EducationService) {}

    @Post()
    create(@Body() dto: CreateEducationDto) {
        return this.educationService.create(dto.name);
    }

    @Get()
    getAll() {
        return this.educationService.getAll();
    }
}
