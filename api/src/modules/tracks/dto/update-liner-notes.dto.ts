import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsArray,
} from 'class-validator';

export class UpdateLinerNotesDto {
  @IsString()
  @MaxLength(50000, { message: 'Liner notes must not exceed 50,000 characters' })
  @IsOptional()
  liner_notes?: string;

  @IsDateString()
  @IsOptional()
  session_date?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  session_location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instruments?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gear?: string[];
}
