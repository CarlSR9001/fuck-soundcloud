import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PreviewLink, Track } from '../../entities';
import { CreatePreviewLinkDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PreviewLinksService {
  constructor(
    @InjectRepository(PreviewLink)
    private previewLinkRepository: Repository<PreviewLink>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async create(
    trackId: string,
    userId: string,
    dto: CreatePreviewLinkDto,
  ): Promise<PreviewLink> {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${trackId} not found`);
    }

    if (track.owner_user_id !== userId) {
      throw new ForbiddenException('Only track owner can create preview links');
    }

    const previewLink = this.previewLinkRepository.create({
      track_id: trackId,
      token: uuidv4(),
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      max_uses: dto.max_uses || null,
      created_by_user_id: userId,
    });

    return await this.previewLinkRepository.save(previewLink);
  }

  async findByToken(token: string): Promise<PreviewLink> {
    const link = await this.previewLinkRepository.findOne({
      where: { token },
      relations: ['track'],
    });

    if (!link) {
      throw new NotFoundException('Preview link not found');
    }

    if (link.expires_at && new Date() > link.expires_at) {
      throw new BadRequestException('Preview link has expired');
    }

    if (link.max_uses && link.use_count >= link.max_uses) {
      throw new BadRequestException('Preview link has reached maximum uses');
    }

    return link;
  }

  async incrementUseCount(linkId: string): Promise<void> {
    await this.previewLinkRepository.increment({ id: linkId }, 'use_count', 1);
  }

  async findByTrack(trackId: string, userId: string): Promise<PreviewLink[]> {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${trackId} not found`);
    }

    if (track.owner_user_id !== userId) {
      throw new ForbiddenException('Only track owner can view preview links');
    }

    return await this.previewLinkRepository.find({
      where: { track_id: trackId },
      order: { created_at: 'DESC' },
    });
  }

  async revoke(linkId: string, userId: string): Promise<void> {
    const link = await this.previewLinkRepository.findOne({
      where: { id: linkId },
      relations: ['track'],
    });

    if (!link) {
      throw new NotFoundException('Preview link not found');
    }

    if (link.track.owner_user_id !== userId) {
      throw new ForbiddenException('Only track owner can revoke preview links');
    }

    await this.previewLinkRepository.delete(linkId);
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.previewLinkRepository.delete({
      expires_at: LessThan(new Date()),
    });

    return result.affected || 0;
  }
}
