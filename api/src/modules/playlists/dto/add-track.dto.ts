import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';

export class AddTrackDto {
  @IsUUID()
  track_id: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
