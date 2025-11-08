import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';

export class InitMultipartDto {
  @IsString()
  filename: string;

  @IsNumber()
  @Min(1)
  size: number;

  @IsString()
  sha256: string;

  @IsString()
  mime: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  parts: number;
}
