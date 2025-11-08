import { IsEnum, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ReportReason } from '../../../entities/report.entity';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  track_id: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsNotEmpty()
  @IsString()
  details: string;

  @IsOptional()
  @IsUrl()
  evidence_url?: string;
}
