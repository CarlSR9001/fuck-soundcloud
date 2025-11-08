import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PlaylistVisibility } from '../../../entities/playlist.entity';

export class UpdatePlaylistDto {
  @IsString()
  @MaxLength(300)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description_md?: string;

  @IsEnum(PlaylistVisibility)
  @IsOptional()
  visibility?: PlaylistVisibility;

  @IsUUID()
  @IsOptional()
  artwork_asset_id?: string;
}
