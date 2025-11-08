import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrackVisibility } from '../../../entities';

export class CopyrightAttestationDto {
  @IsBoolean()
  attests_ownership: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  copyright_registration?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  isrc_code?: string;
}

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // Copyright attestation (required)
  @ValidateNested()
  @Type(() => CopyrightAttestationDto)
  attestation: CopyrightAttestationDto;
}
