import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { StreamService } from './stream.service';
import { TranscodeFormat } from '../../entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/v1/stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get(':versionId.m3u8')
  async getStreamUrl(
    @Param('versionId') versionId: string,
    @Query('format') format?: TranscodeFormat,
    @Req() request?: Request,
  ) {
    // Extract userId from JWT if present (optional auth)
    const userId = (request as any)?.user?.userId;

    return await this.streamService.getStreamUrl(
      versionId,
      format,
      userId,
    );
  }
}

@Controller('api/v1/versions')
export class VersionsController {
  constructor(private readonly streamService: StreamService) {}

  @Get(':id/waveform')
  async getWaveform(@Param('id') id: string) {
    const url = await this.streamService.getWaveformUrl(id);
    return { url };
  }
}
