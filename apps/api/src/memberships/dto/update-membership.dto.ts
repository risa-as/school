import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipDto {
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
