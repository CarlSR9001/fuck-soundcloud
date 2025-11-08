import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { DownloadPolicy } from '../../../entities';

export class UpdateDownloadPolicyDto {
  @IsEnum(DownloadPolicy)
  download_policy: DownloadPolicy;

  @IsOptional()
  @IsInt()
  @Min(0)
  download_price_cents?: number | null;
}
