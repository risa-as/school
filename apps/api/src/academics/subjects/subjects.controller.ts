import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  @Permissions('academics.read')
  findAll(@Query('gradeLevelId') gradeLevelId?: string) {
    return this.service.findAll(gradeLevelId);
  }

  @Get(':id')
  @Permissions('academics.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('academics.write')
  create(@Body() dto: CreateSubjectDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('academics.write')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('academics.write')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
