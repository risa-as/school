import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StageType } from '@prisma/client';

export class CreateSchoolOwnerDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  name!: string;

  /** Subdomain-safe slug, e.g. "al-noor-school". */
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug يجب أن يكون بأحرف لاتينية صغيرة وأرقام وشرطات فقط',
  })
  slug!: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(StageType, { each: true })
  stageTypes?: StageType[];

  @ValidateNested()
  @Type(() => CreateSchoolOwnerDto)
  owner!: CreateSchoolOwnerDto;
}
