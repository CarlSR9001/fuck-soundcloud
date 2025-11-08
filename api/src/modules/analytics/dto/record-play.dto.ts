import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class RecordPlayDto {
  @IsUUID('4', { message: 'track_id must be a valid UUID' })
  track_id: string;

  @IsNumber()
  @Min(0)
  @Max(86400000) // Max 24 hours in ms
  watch_ms: number;

  @IsBoolean()
  completed: boolean;

  @IsString()
  @IsOptional()
  referrer?: string;
}
