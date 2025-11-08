import {
  IsArray,
  IsUUID,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TrackPositionDto {
  @IsUUID()
  track_id: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackPositionDto)
  track_positions: TrackPositionDto[];
}
