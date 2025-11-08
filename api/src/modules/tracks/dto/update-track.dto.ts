import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsArray,
} from 'class-validator';
import { TrackVisibility } from '../../../entities';

export class UpdateTrackDto {
  @IsString()
  @MaxLength(300)
  @IsOptional()
  title?: string;

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
  @IsOptional()
  artwork_asset_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
