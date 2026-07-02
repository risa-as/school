import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('academic-years')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Get()
  @Permissions('academics.read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('academics.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('academics.write')
  create(@Body() dto: CreateAcademicYearDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('academics.write')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('academics.write')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
