import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('sections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SectionsController {
  constructor(private readonly service: SectionsService) {}

  @Get()
  @Permissions('academics.read')
  findAll(@Query('academicYearId') academicYearId?: string) {
    return this.service.findAll(academicYearId);
  }

  @Get(':id')
  @Permissions('academics.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('academics.write')
  create(@Body() dto: CreateSectionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('academics.write')
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('academics.write')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
