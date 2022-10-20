import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Education, EducationSchema } from '../../schemas';
import { EducationController } from './education.controller';
import { EducationProfile } from './education.profile';
import { EducationService } from './education.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Education.name, schema: EducationSchema }])],
    controllers: [EducationController],
    providers: [EducationService, EducationProfile],
})
export class EducationModule {}
