import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { StemRole } from '../../../entities';

export class CreateStemDto {
  @IsEnum(StemRole)
  role: StemRole;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsUUID()
  asset_id: string;
}
