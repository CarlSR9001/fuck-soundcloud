import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchType {
  TRACK = 'track',
  PLAYLIST = 'playlist',
  USER = 'user',
  ALL = 'all',
}

export class SearchDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  q: string;

  @IsEnum(SearchType)
  @IsOptional()
  type?: SearchType = SearchType.ALL;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
