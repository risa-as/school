import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
import { StageType } from '@prisma/client';

export class CreateGradeLevelDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(StageType)
  stage!: StageType;

  @IsInt()
  @Min(1)
  order!: number;
}
