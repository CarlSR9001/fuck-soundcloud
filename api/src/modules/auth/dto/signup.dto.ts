import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Handle must contain only letters, numbers, underscores, and hyphens',
  })
  handle: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  display_name: string;
}
