import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DmcaStatus } from '../../../entities/dmca-request.entity';

export class ProcessDmcaDto {
  @IsEnum(DmcaStatus)
  status: DmcaStatus;

  @IsOptional()
  @IsString()
  resolution_notes?: string;
}
