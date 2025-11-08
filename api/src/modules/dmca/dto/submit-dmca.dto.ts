import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class SubmitDmcaDto {
  @IsNotEmpty()
  @IsString()
  complainant_name: string;

  @IsEmail()
  complainant_email: string;

  @IsOptional()
  @IsString()
  complainant_phone?: string;

  @IsOptional()
  @IsString()
  complainant_address?: string;

  @IsNotEmpty()
  @IsString()
  track_id: string;

  @IsNotEmpty()
  @IsString()
  infringement_description: string;

  @IsNotEmpty()
  @IsString()
  original_work_description: string;

  @IsOptional()
  @IsUrl()
  original_work_url?: string;

  @IsBoolean()
  good_faith_statement: boolean;

  @IsBoolean()
  perjury_statement: boolean;

  @IsNotEmpty()
  @IsString()
  signature: string;
}
