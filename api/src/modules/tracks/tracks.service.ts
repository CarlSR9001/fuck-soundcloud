import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import {
  Track,
  TrackVersion,
  TrackVersionStatus,
  Transcode,
  TranscodeFormat,
} from '../../entities';
import { CreateTrackDto, UpdateTrackDto, CreateVersionDto } from './dto';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(TrackVersion)
    private versionRepository: Repository<TrackVersion>,
    @InjectRepository(Transcode)
    private transcodeRepository: Repository<Transcode>,
    @InjectQueue('transcode') private transcodeQueue: Queue,
    @InjectQueue('waveform') private waveformQueue: Queue,
  ) {}

  async create(ownerId: string, dto: CreateTrackDto) {
    const { title, original_asset_id, version_label, ...rest } = dto;

    // Generate slug from title
    const slug = this.generateSlug(title);

    // Create track
    const track = this.trackRepository.create({
      owner_user_id: ownerId,
      slug,
      title,
      ...rest,
    });

    await this.trackRepository.save(track);

    // Create initial version
    const version = await this.createVersionForTrack(
      track.id,
      original_asset_id,
      version_label || 'v1',
    );

    // Set primary version
    track.primary_version_id = version.id;
    await this.trackRepository.save(track);

    return { track, version };
  }

  async findOne(id: string) {
    const track = await this.trackRepository.findOne({
      where: { id },
      relations: ['versions', 'versions.transcodes', 'versions.waveform'],
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${id} not found`);
    }

    return track;
  }

  async findBySlug(slug: string) {
    const track = await this.trackRepository.findOne({
      where: { slug },
      relations: ['versions', 'versions.transcodes', 'versions.waveform'],
    });

    if (!track) {
      throw new NotFoundException(`Track with slug ${slug} not found`);
    }

    return track;
  }

  async update(id: string, dto: UpdateTrackDto) {
    const track = await this.findOne(id);
    Object.assign(track, dto);
    return await this.trackRepository.save(track);
  }

  async createVersion(trackId: string, dto: CreateVersionDto) {
    const track = await this.findOne(trackId);
    const version = await this.createVersionForTrack(
      track.id,
      dto.original_asset_id,
      dto.version_label || `v${track.versions.length + 1}`,
    );
    return version;
  }

  private async createVersionForTrack(
    trackId: string,
    originalAssetId: string,
    versionLabel: string,
  ) {
    // Create version
    const version = this.versionRepository.create({
      track_id: trackId,
      original_asset_id: originalAssetId,
      version_label: versionLabel,
      status: TrackVersionStatus.PENDING,
    });

    await this.versionRepository.save(version);

    // Create transcode records
    const transcodeFormats = [TranscodeFormat.HLS_OPUS];
    for (const format of transcodeFormats) {
      const transcode = this.transcodeRepository.create({
        track_version_id: version.id,
        format,
      });
      await this.transcodeRepository.save(transcode);
    }

    // Enqueue transcode job
    await this.transcodeQueue.add('transcode', {
      versionId: version.id,
    });

    // Enqueue waveform job
    await this.waveformQueue.add('waveform', {
      versionId: version.id,
    });

    return version;
  }

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Add timestamp to ensure uniqueness
    return `${baseSlug}-${Date.now()}`;
  }
}
