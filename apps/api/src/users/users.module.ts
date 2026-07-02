import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { MembershipsController } from '../memberships/memberships.controller';
import { MembershipsService } from '../memberships/memberships.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, MembershipsController],
  providers: [UsersService, MembershipsService],
  exports: [UsersService],
})
export class UsersModule {}
