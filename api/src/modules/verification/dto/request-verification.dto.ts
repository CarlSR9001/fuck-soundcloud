import {
  IsEnum,
  IsString,
  IsNotEmpty,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { VerificationMethod } from '../../../entities';

export class RequestVerificationDto {
  @IsEnum(VerificationMethod)
  method: VerificationMethod;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  evidence_data: string;

  // Domain verification: domain name (e.g., "artist.com")
  // Social verification: URL to post with verification code
  // Spotify: Artist URL or ID
  // Bandcamp: Artist URL
}
