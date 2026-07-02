import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';

/**
 * Platform-level routes — NOT guarded by JwtAuthGuard/PermissionsGuard
 * (there is no membership/role yet for a school that doesn't exist).
 * Guarded instead by PlatformAdminGuard (a PLATFORM_ADMIN_API_KEY shared
 * secret) so this isn't a public, unauthenticated tenant-creation endpoint.
 * Real deployments will replace this with a full platform-admin auth
 * mechanism before go-live.
 */
@Controller('tenants')
@UseGuards(PlatformAdminGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSchool(@Body() dto: CreateSchoolDto) {
    return this.tenantsService.createSchool(dto);
  }
}
