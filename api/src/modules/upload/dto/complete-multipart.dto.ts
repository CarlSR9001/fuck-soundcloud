import { IsString, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ETagDto {
  @IsInt()
  partNumber: number;

  @IsString()
  etag: string;
}

export class CompleteMultipartDto {
  @IsString()
  uploadId: string;

  @IsString()
  key: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ETagDto)
  etags: ETagDto[];
}
