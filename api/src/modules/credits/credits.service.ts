import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit, Track } from '../../entities';
import { CreateCreditDto } from './dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private creditRepository: Repository<Credit>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async create(trackId: string, userId: string, dto: CreateCreditDto) {
    // Verify track exists and user is owner
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${trackId} not found`);
    }

    if (track.owner_user_id !== userId) {
      throw new ForbiddenException(
        'Only the track owner can add credits',
      );
    }

    // Create credit
    const credit = this.creditRepository.create({
      track_id: trackId,
      person_name: dto.person_name,
      role: dto.role,
      url: dto.url || null,
    });

    return await this.creditRepository.save(credit);
  }

  async remove(creditId: string, userId: string) {
    const credit = await this.creditRepository.findOne({
      where: { id: creditId },
      relations: ['track'],
    });

    if (!credit) {
      throw new NotFoundException(`Credit with ID ${creditId} not found`);
    }

    if (credit.track.owner_user_id !== userId) {
      throw new ForbiddenException(
        'Only the track owner can remove credits',
      );
    }

    await this.creditRepository.remove(credit);
    return { message: 'Credit removed successfully' };
  }

  async findByTrack(trackId: string) {
    return await this.creditRepository.find({
      where: { track_id: trackId },
      order: { created_at: 'ASC' },
    });
  }
}
