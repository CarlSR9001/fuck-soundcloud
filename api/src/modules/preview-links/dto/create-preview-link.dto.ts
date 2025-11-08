import { IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePreviewLinkDto {
  @IsDateString()
  @IsOptional()
  expires_at?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_uses?: number;
}
