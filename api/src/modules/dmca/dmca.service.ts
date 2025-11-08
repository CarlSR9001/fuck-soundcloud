import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DmcaRequest,
  DmcaStatus,
} from '../../entities/dmca-request.entity';
import { Track, TrackVisibility } from '../../entities/track.entity';
import { Strike, StrikeReason } from '../../entities/strike.entity';
import { User } from '../../entities/user.entity';
import { SubmitDmcaDto } from './dto/submit-dmca.dto';
import { ProcessDmcaDto } from './dto/process-dmca.dto';

@Injectable()
export class DmcaService {
  constructor(
    @InjectRepository(DmcaRequest)
    private dmcaRepo: Repository<DmcaRequest>,
    @InjectRepository(Track)
    private tracksRepo: Repository<Track>,
    @InjectRepository(Strike)
    private strikesRepo: Repository<Strike>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async submit(dto: SubmitDmcaDto): Promise<DmcaRequest> {
    const track = await this.tracksRepo.findOne({
      where: { id: dto.track_id },
      relations: ['owner'],
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    const dmcaRequest = this.dmcaRepo.create({
      complainant_name: dto.complainant_name,
      complainant_email: dto.complainant_email,
      complainant_phone: dto.complainant_phone,
      complainant_address: dto.complainant_address,
      track_id: dto.track_id,
      infringement_description: dto.infringement_description,
      original_work_description: dto.original_work_description,
      original_work_url: dto.original_work_url,
      good_faith_statement: dto.good_faith_statement,
      perjury_statement: dto.perjury_statement,
      signature: dto.signature,
      status: DmcaStatus.RECEIVED,
    });

    const saved = await this.dmcaRepo.save(dmcaRequest);

    // TODO: Send notification email to track owner
    // await this.notificationService.sendDmcaNotification(track.owner);

    return saved;
  }

  async findAll(page = 1, limit = 20) {
    const [requests, total] = await this.dmcaRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<DmcaRequest> {
    const request = await this.dmcaRepo.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('DMCA request not found');
    }

    return request;
  }

  async process(id: string, dto: ProcessDmcaDto): Promise<DmcaRequest> {
    const dmcaRequest = await this.findOne(id);

    dmcaRequest.status = dto.status;
    dmcaRequest.resolution_notes = dto.resolution_notes || null;
    dmcaRequest.resolved_at = new Date();

    // If content removed, take down track and issue strike
    if (dto.status === DmcaStatus.CONTENT_REMOVED) {
      await this.handleContentRemoved(dmcaRequest);
    }

    return this.dmcaRepo.save(dmcaRequest);
  }

  private async handleContentRemoved(dmcaRequest: DmcaRequest) {
    const track = await this.tracksRepo.findOne({
      where: { id: dmcaRequest.track_id },
      relations: ['owner'],
    });

    if (!track) {
      return;
    }

    // Remove track from public visibility
    track.visibility = TrackVisibility.PRIVATE;
    await this.tracksRepo.save(track);

    // Issue DMCA strike to track owner
    const strike = this.strikesRepo.create({
      user_id: track.owner_user_id,
      reason: StrikeReason.DMCA_TAKEDOWN,
      details: `DMCA takedown: ${dmcaRequest.infringement_description}`,
      track_id: track.id,
      issued_by_id: track.owner_user_id, // System-issued
    });

    await this.strikesRepo.save(strike);

    // Check if user should be banned (3-strike policy)
    await this.checkAndBanUser(track.owner_user_id);

    // TODO: Send notification email to track owner
    // await this.notificationService.sendDmcaTakedownNotification(track.owner, dmcaRequest);
  }

  private async checkAndBanUser(userId: string) {
    const strikeCount = await this.strikesRepo.count({
      where: { user_id: userId },
    });

    if (strikeCount >= 3) {
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (user && !user.is_banned) {
        user.is_banned = true;
        user.ban_reason = 'Automatic ban: 3 strikes accumulated';
        user.banned_at = new Date();
        await this.usersRepo.save(user);
      }
    }
  }
}
