import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateSectionDto {
  @IsUUID()
  academicYearId!: string;

  @IsUUID()
  gradeLevelId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
