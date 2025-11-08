import { IsDateString, IsOptional } from 'class-validator';

export class ScheduleTrackDto {
  @IsDateString()
  @IsOptional()
  published_at?: string;

  @IsDateString()
  @IsOptional()
  embargo_until?: string;
}
