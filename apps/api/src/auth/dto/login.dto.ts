import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Phone number or email — whichever the user registered with. */
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
