import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { VerificationStatus } from '../../../entities';

export class VerifyRequestDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejection_reason?: string;
}
