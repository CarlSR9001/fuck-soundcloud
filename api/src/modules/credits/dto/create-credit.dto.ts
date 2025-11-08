import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { CreditRole } from '../../../entities/credit.entity';

export class CreateCreditDto {
  @IsString()
  @MaxLength(200)
  person_name: string;

  @IsEnum(CreditRole, {
    message: 'role must be one of: writer, producer, mixer, mastering, feature, musician, other',
  })
  role: CreditRole;

  @IsUrl({}, { message: 'url must be a valid URL' })
  @IsOptional()
  url?: string;
}
