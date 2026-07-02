import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/** UI locale preference — kept in sync with docs/ARCHITECTURE.md's Arabic-first, ckb/en-later plan. */
export const SUPPORTED_LOCALES = ['ar', 'ckb', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: SupportedLocale;
}
