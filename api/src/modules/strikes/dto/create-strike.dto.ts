import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { StrikeReason } from '../../../entities/strike.entity';

export class CreateStrikeDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsEnum(StrikeReason)
  reason: StrikeReason;

  @IsNotEmpty()
  @IsString()
  details: string;

  @IsOptional()
  @IsString()
  track_id?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
