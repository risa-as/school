import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GradeLevelsService } from './grade-levels.service';
import { CreateGradeLevelDto } from '../dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from '../dto/update-grade-level.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('grade-levels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradeLevelsController {
  constructor(private readonly service: GradeLevelsService) {}

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
  create(@Body() dto: CreateGradeLevelDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('academics.write')
  update(@Param('id') id: string, @Body() dto: UpdateGradeLevelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('academics.write')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
