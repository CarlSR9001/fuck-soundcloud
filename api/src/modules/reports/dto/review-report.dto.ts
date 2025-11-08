import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReportStatus } from '../../../entities/report.entity';

export class ReviewReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  resolution_notes?: string;
}
