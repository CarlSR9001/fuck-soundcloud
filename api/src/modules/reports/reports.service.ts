import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Report,
  ReportStatus,
  ReportReason,
} from '../../entities/report.entity';
import { Track, TrackVisibility } from '../../entities/track.entity';
import { Strike, StrikeReason } from '../../entities/strike.entity';
import { User } from '../../entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepo: Repository<Report>,
    @InjectRepository(Track)
    private tracksRepo: Repository<Track>,
    @InjectRepository(Strike)
    private strikesRepo: Repository<Strike>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateReportDto): Promise<Report> {
    const track = await this.tracksRepo.findOne({
      where: { id: dto.track_id },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Prevent self-reporting
    if (track.owner_user_id === userId) {
      throw new ForbiddenException('Cannot report your own track');
    }

    const report = this.reportsRepo.create({
      reporter_id: userId,
      track_id: dto.track_id,
      reason: dto.reason,
      details: dto.details,
      evidence_url: dto.evidence_url,
      status: ReportStatus.PENDING,
    });

    return this.reportsRepo.save(report);
  }

  async findAll(page = 1, limit = 20) {
    const [reports, total] = await this.reportsRepo.findAndCount({
      relations: ['reporter', 'track', 'track.owner', 'reviewed_by'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: ['reporter', 'track', 'track.owner', 'reviewed_by'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async review(
    id: string,
    adminId: string,
    dto: ReviewReportDto,
  ): Promise<Report> {
    const report = await this.findOne(id);

    report.status = dto.status;
    report.resolution_notes = dto.resolution_notes || null;
    report.reviewed_by_id = adminId;
    report.resolved_at = new Date();

    // If resolved as removed, hide the track and create a strike
    if (dto.status === ReportStatus.RESOLVED_REMOVED) {
      await this.handleResolvedRemoved(report, adminId);
    }

    return this.reportsRepo.save(report);
  }

  private async handleResolvedRemoved(report: Report, adminId: string) {
    const track = await this.tracksRepo.findOne({
      where: { id: report.track_id },
      relations: ['owner'],
    });

    if (!track) {
      return;
    }

    // Hide track from public search
    track.visibility = TrackVisibility.PRIVATE;
    await this.tracksRepo.save(track);

    // Issue strike to track owner
    const strikeReason = this.mapReportReasonToStrikeReason(report.reason);
    const strike = this.strikesRepo.create({
      user_id: track.owner_user_id,
      reason: strikeReason,
      details: `Strike issued from report: ${report.details}`,
      report_id: report.id,
      track_id: track.id,
      issued_by_id: adminId,
    });

    await this.strikesRepo.save(strike);

    // Check if user should be banned (3-strike policy)
    await this.checkAndBanUser(track.owner_user_id);
  }

  private mapReportReasonToStrikeReason(reason: ReportReason): StrikeReason {
    const mapping: Record<ReportReason, StrikeReason> = {
      [ReportReason.COPYRIGHT_INFRINGEMENT]: StrikeReason.COPYRIGHT_INFRINGEMENT,
      [ReportReason.SPAM]: StrikeReason.SPAM,
      [ReportReason.HARASSMENT]: StrikeReason.HARASSMENT,
      [ReportReason.HATE_SPEECH]: StrikeReason.TOS_VIOLATION,
      [ReportReason.IMPERSONATION]: StrikeReason.TOS_VIOLATION,
      [ReportReason.OTHER]: StrikeReason.TOS_VIOLATION,
    };

    return mapping[reason];
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

  async getTrackReports(trackId: string): Promise<Report[]> {
    return this.reportsRepo.find({
      where: { track_id: trackId },
      relations: ['reporter', 'reviewed_by'],
      order: { created_at: 'DESC' },
    });
  }
}
