import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stem, TrackVersion, Asset, Track } from '../../entities';
import { StorageService } from '../storage';
import { CreateStemDto } from './dto';

@Injectable()
export class StemsService {
  constructor(
    @InjectRepository(Stem)
    private stemRepository: Repository<Stem>,
    @InjectRepository(TrackVersion)
    private versionRepository: Repository<TrackVersion>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private storageService: StorageService,
  ) {}

  async create(versionId: string, dto: CreateStemDto, userId: string) {
    // Verify version exists and user owns the track
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['track'],
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Load track with owner check
    const track = await this.trackRepository.findOne({
      where: { id: version.track_id },
    });

    if (!track || track.owner_user_id !== userId) {
      throw new ForbiddenException('Only track owner can upload stems');
    }

    // Verify asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: dto.asset_id },
    });

    if (!asset) {
      throw new BadRequestException(`Asset ${dto.asset_id} not found`);
    }

    // Create stem
    const stem = this.stemRepository.create({
      track_version_id: versionId,
      role: dto.role,
      title: dto.title,
      asset_id: dto.asset_id,
    });

    await this.stemRepository.save(stem);
    return stem;
  }

  async findByVersion(versionId: string) {
    return await this.stemRepository.find({
      where: { track_version_id: versionId },
      relations: ['asset'],
      order: { created_at: 'ASC' },
    });
  }

  async getDownloadUrl(id: string) {
    const stem = await this.stemRepository.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!stem) {
      throw new NotFoundException(`Stem ${id} not found`);
    }

    const url = await this.storageService.getObjectUrl(
      stem.asset.bucket,
      stem.asset.key,
      3600,
    );

    return { url };
  }

  async delete(id: string, userId: string) {
    const stem = await this.stemRepository.findOne({
      where: { id },
      relations: ['trackVersion', 'trackVersion.track', 'asset'],
    });

    if (!stem) {
      throw new NotFoundException(`Stem ${id} not found`);
    }

    // Check ownership
    if (stem.trackVersion.track.owner_user_id !== userId) {
      throw new ForbiddenException('Only track owner can delete stems');
    }

    // Delete asset from storage
    await this.storageService.deleteObject(
      stem.asset.bucket,
      stem.asset.key,
    );

    // Delete stem record
    await this.stemRepository.remove(stem);

    return { message: 'Stem deleted successfully' };
  }
}
