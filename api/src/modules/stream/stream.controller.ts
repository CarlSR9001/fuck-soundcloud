import { Controller, Get, Param, Query } from '@nestjs/common';
import { StreamService } from './stream.service';
import { TranscodeFormat } from '../../entities';

@Controller('api/v1/stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get(':versionId.m3u8')
  async getStreamUrl(
    @Param('versionId') versionId: string,
    @Query('format') format?: TranscodeFormat,
  ) {
    return await this.streamService.getStreamUrl(
      versionId,
      format || TranscodeFormat.HLS_OPUS,
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
