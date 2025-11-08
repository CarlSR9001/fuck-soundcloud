import { IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @IsUUID()
  original_asset_id: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  version_label?: string;
}
