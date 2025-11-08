import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  track_id: string;

  @IsString()
  @MaxLength(2000, {
    message: 'Comment body must not exceed 2000 characters',
  })
  body_md: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  at_ms?: number;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
