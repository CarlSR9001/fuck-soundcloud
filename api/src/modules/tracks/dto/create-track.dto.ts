import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TrackVisibility } from '../../../entities';

export class CreateTrackDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsOptional()
  description_md?: string;

  @IsEnum(TrackVisibility)
  @IsOptional()
  visibility?: TrackVisibility;

  @IsDateString()
  @IsOptional()
  release_at?: string;

  @IsUUID()
  original_asset_id: string;

  @IsUUID()
  @IsOptional()
  artwork_asset_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  version_label?: string;
}
