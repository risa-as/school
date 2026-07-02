import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';

export class MembershipUserDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Required only when inviting a brand-new user (userId not supplied). */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class CreateMembershipDto {
  @IsUUID()
  roleId!: string;

  /** Attach an existing platform user to this school. */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /** Or create a brand-new user and attach them in the same call. */
  @IsOptional()
  @ValidateNested()
  @Type(() => MembershipUserDto)
  user?: MembershipUserDto;
}
