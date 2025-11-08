import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class CreateCharityDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUrl()
  website_url: string;

  @IsString()
  @IsOptional()
  tax_id?: string;

  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
