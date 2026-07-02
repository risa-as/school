import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  studentNumber!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
