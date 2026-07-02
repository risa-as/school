import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademicYearsController } from './academic-years/academic-years.controller';
import { AcademicYearsService } from './academic-years/academic-years.service';
import { GradeLevelsController } from './grade-levels/grade-levels.controller';
import { GradeLevelsService } from './grade-levels/grade-levels.service';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { SubjectsController } from './subjects/subjects.controller';
import { SubjectsService } from './subjects/subjects.service';

@Module({
  imports: [AuthModule],
  controllers: [AcademicYearsController, GradeLevelsController, SectionsController, SubjectsController],
  providers: [AcademicYearsService, GradeLevelsService, SectionsService, SubjectsService],
})
export class AcademicsModule {}
