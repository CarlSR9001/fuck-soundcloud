import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createHash } from 'crypto';
import {
  Track,
  Download,
  DownloadFormat,
  DownloadPolicy,
  CopyrightAttestation,
  TrackVersion,
} from '../../entities';
import { StorageService } from '../storage/storage.service';
import { UpdateDownloadPolicyDto } from './dto';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    @InjectRepository(CopyrightAttestation)
    private attestationRepository: Repository<CopyrightAttestation>,
    @InjectRepository(TrackVersion)
    private versionRepository: Repository<TrackVersion>,
    @InjectQueue('mp3-transcode') private mp3TranscodeQueue: Queue,
    private storageService: StorageService,
  ) {}

  async updateDownloadPolicy(
    trackId: string,
    ownerId: string,
    dto: UpdateDownloadPolicyDto,
  ) {
    const track = await this.trackRepository.findOne({
      where: { id: trackId, owner_user_id: ownerId },
    });

    if (!track) {
      throw new NotFoundException('Track not found or access denied');
    }

    track.download_policy = dto.download_policy;
    track.download_price_cents = dto.download_price_cents ?? null;

    return await this.trackRepository.save(track);
  }

  async generateDownloadUrl(
    trackId: string,
    userId: string,
    ipAddress: string,
  ): Promise<{ url: string; format: string; expires_in: number }> {
    // Find track with relations
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
      relations: ['versions'],
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Check download policy
    if (track.download_policy === DownloadPolicy.DISABLED) {
      throw new ForbiddenException('Downloads are disabled for this track');
    }

    // Check copyright attestation exists
    const attestation = await this.attestationRepository.findOne({
      where: { track_id: trackId },
    });

    if (!attestation) {
      throw new ForbiddenException(
        'Copyright attestation required before downloads',
      );
    }

    // Get primary version
    const version = await this.versionRepository.findOne({
      where: { id: track.primary_version_id },
      relations: ['original_asset'],
    });

    if (!version || !version.original_asset) {
      throw new NotFoundException('Track version or asset not found');
    }

    let bucket: string;
    let key: string;
    let format: DownloadFormat;

    // Determine format based on policy
    if (track.download_policy === DownloadPolicy.LOSSY) {
      format = DownloadFormat.LOSSY_320;
      bucket = this.storageService.getBucketName('transcodes');
      key = `downloads/${trackId}/320.mp3`;

      // Check if MP3 exists, if not trigger transcode
      try {
        await this.storageService.getObjectUrl(bucket, key, 60);
      } catch (error) {
        // MP3 doesn't exist, trigger transcode job
        await this.mp3TranscodeQueue.add('mp3-transcode', {
          version_id: version.id,
          track_id: trackId,
        });
        throw new ForbiddenException(
          'Transcoding in progress. Please try again in a few moments.',
        );
      }
    } else if (track.download_policy === DownloadPolicy.ORIGINAL) {
      format = DownloadFormat.ORIGINAL;
      bucket = version.original_asset.bucket;
      key = version.original_asset.key;
    } else {
      // STEMS_INCLUDED not implemented in this phase
      throw new ForbiddenException('Stems download not yet supported');
    }

    // Generate signed URL (expires in 1 hour)
    const url = await this.storageService.getObjectUrl(bucket, key, 3600);

    // Record download
    const ipHash = createHash('sha256').update(ipAddress).digest('hex');
    const download = this.downloadRepository.create({
      user_id: userId,
      track_id: trackId,
      track_version_id: version.id,
      format,
      ip_hash: ipHash,
    });
    await this.downloadRepository.save(download);

    return {
      url,
      format,
      expires_in: 3600,
    };
  }

  async getDownloadHistory(trackId: string, ownerId: string) {
    // Verify ownership
    const track = await this.trackRepository.findOne({
      where: { id: trackId, owner_user_id: ownerId },
    });

    if (!track) {
      throw new NotFoundException('Track not found or access denied');
    }

    // Get downloads with user info
    const downloads = await this.downloadRepository.find({
      where: { track_id: trackId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: 100,
    });

    return downloads.map((d) => ({
      id: d.id,
      user_handle: d.user.handle,
      format: d.format,
      ip_hash: d.ip_hash.substring(0, 16), // Show partial hash for privacy
      created_at: d.created_at,
    }));
  }
}
