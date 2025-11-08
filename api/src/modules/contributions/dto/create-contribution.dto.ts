import { IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { ContributionType } from '@/entities/contribution.entity';

export class CreateContributionDto {
  @IsNumber()
  @Min(1)
  amount_cents: number;

  @IsEnum(ContributionType)
  @IsOptional()
  type?: ContributionType;

  @IsString()
  @IsOptional()
  selected_charity_id?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  artists_percentage?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  charity_percentage?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  platform_percentage?: number;
}
