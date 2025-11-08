import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { TrackVersion, Transcode, TranscodeFormat } from '../../entities';
import { StorageService } from '../storage';

@Injectable()
export class StreamService {
  private readonly secureLinkSecret: string;
  private readonly hlsTokenTTL: number;

  constructor(
    @InjectRepository(TrackVersion)
    private versionRepository: Repository<TrackVersion>,
    @InjectRepository(Transcode)
    private transcodeRepository: Repository<Transcode>,
    private configService: ConfigService,
    private storageService: StorageService,
  ) {
    this.secureLinkSecret =
      this.configService.get<string>('SECURE_LINK_SECRET') || 'change-me-secret';
    this.hlsTokenTTL =
      parseInt(this.configService.get<string>('HLS_TOKEN_TTL_SECONDS') || '3600', 10);
  }

  async getStreamUrl(versionId: string, format: TranscodeFormat = TranscodeFormat.HLS_OPUS) {
    // Find version with transcodes
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['transcodes'],
    });

    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Find the requested transcode
    const transcode = version.transcodes.find((t) => t.format === format);

    if (!transcode || transcode.status !== 'ready') {
      throw new Error(`Transcode ${format} not ready for version ${versionId}`);
    }

    // Get the playlist asset ID and construct the path
    const playlistKey = await this.getPlaylistKey(transcode.id);

    // Generate signed URL
    const signedUrl = this.generateSignedUrl(playlistKey);

    return {
      url: signedUrl,
      expiresIn: this.hlsTokenTTL,
      format: transcode.format,
    };
  }

  private async getPlaylistKey(transcodeId: string): Promise<string> {
    const transcode = await this.transcodeRepository.findOne({
      where: { id: transcodeId },
    });

    if (!transcode || !transcode.segment_prefix_key) {
      throw new Error(`Transcode ${transcodeId} has no playlist`);
    }

    return `${transcode.segment_prefix_key}/playlist.m3u8`;
  }

  private generateSignedUrl(playlistKey: string): string {
    const expires = Math.floor(Date.now() / 1000) + this.hlsTokenTTL;
    const path = `/media/hls/${playlistKey}`;

    // Nginx secure_link format: md5(secret + path + expires)
    const signData = `${this.secureLinkSecret}${path}${expires}`;
    const md5 = createHash('md5').update(signData).digest('base64url');

    return `${path}?md5=${md5}&expires=${expires}`;
  }

  async getWaveformUrl(versionId: string): Promise<string> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['waveform'],
    });

    if (!version || !version.waveform) {
      throw new Error(`Waveform not found for version ${versionId}`);
    }

    // Waveforms bucket is public, so we can use MinIO presigned URL
    const waveformBucket = this.storageService.getBucketName('waveforms');
    // For now, return a public path - in production you'd fetch the actual key from Asset
    return `/images/waveforms/${version.waveform.json_asset_id}.json`;
  }
}
