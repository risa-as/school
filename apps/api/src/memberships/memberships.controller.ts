import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Permissions('users.manage')
  list(@Query() query: PaginationQueryDto) {
    return this.membershipsService.list(query);
  }

  @Post()
  @Permissions('users.manage')
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Patch(':id')
  @Permissions('users.manage')
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.membershipsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Permissions('users.manage')
  remove(@Param('id') id: string) {
    return this.membershipsService.remove(id);
  }
}
