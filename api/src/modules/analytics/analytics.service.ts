import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { createHash } from 'crypto';
import { AnalyticsPlay, AnalyticsDaily, Track } from '../../entities';
import { RecordPlayDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsPlay)
    private playRepository: Repository<AnalyticsPlay>,
    @InjectRepository(AnalyticsDaily)
    private dailyRepository: Repository<AnalyticsDaily>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectQueue('analytics') private analyticsQueue: Queue,
  ) {}

  async recordPlay(
    dto: RecordPlayDto,
    ipAddress: string,
    userAgent: string | undefined,
    userId?: string,
  ) {
    // Verify track exists
    const track = await this.trackRepository.findOne({
      where: { id: dto.track_id },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${dto.track_id} not found`);
    }

    // Hash IP for privacy
    const ipHash = this.hashIpAddress(ipAddress);

    // Create play record
    const play = this.playRepository.create({
      track_id: dto.track_id,
      user_id: userId || null,
      ip_hash: ipHash,
      user_agent: userAgent || null,
      watch_ms: dto.watch_ms,
      completed: dto.completed,
      referrer: dto.referrer || null,
      country: null, // Country lookup can be added later
    });

    await this.playRepository.save(play);

    // Enqueue rollup job for daily aggregation
    await this.analyticsQueue.add('rollup', {
      trackId: dto.track_id,
      date: new Date().toISOString().split('T')[0],
    });

    return { success: true, play_id: play.id };
  }

  async getTrackStats(trackId: string, userId: string) {
    await this.verifyTrackOwnership(trackId, userId);

    const [totalPlays, completions, uniqueResult, countryBreakdown] =
      await Promise.all([
        this.playRepository.count({ where: { track_id: trackId } }),
        this.playRepository.count({
          where: { track_id: trackId, completed: true },
        }),
        this.playRepository
          .createQueryBuilder('play')
          .select('COUNT(DISTINCT play.ip_hash)', 'count')
          .where('play.track_id = :trackId', { trackId })
          .getRawOne(),
        this.playRepository
          .createQueryBuilder('play')
          .select('play.country', 'country')
          .addSelect('COUNT(*)', 'plays')
          .where('play.track_id = :trackId', { trackId })
          .andWhere('play.country IS NOT NULL')
          .groupBy('play.country')
          .orderBy('plays', 'DESC')
          .getRawMany(),
      ]);

    const uniquePlays = parseInt(uniqueResult.count) || 0;

    return {
      track_id: trackId,
      total_plays: totalPlays,
      unique_plays: uniquePlays,
      completions,
      completion_rate:
        totalPlays > 0 ? (completions / totalPlays) * 100 : 0,
      countries: countryBreakdown,
    };
  }

  async getDailyStats(trackId: string, userId: string, days: number = 30) {
    await this.verifyTrackOwnership(trackId, userId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const dailyStats = await this.dailyRepository.find({
      where: { track_id: trackId },
      order: { day: 'ASC' },
    });

    const filteredStats = dailyStats.filter(
      (stat) => stat.day >= startDateStr && stat.day <= endDateStr,
    );

    return {
      track_id: trackId,
      period: { start: startDateStr, end: endDateStr },
      daily: filteredStats.map((stat) => ({
        date: stat.day,
        plays: stat.plays,
        uniques: stat.uniques,
        completions: stat.completions,
        likes: stat.likes,
        reposts: stat.reposts,
        downloads: stat.downloads,
      })),
      totals: {
        plays: filteredStats.reduce((sum, s) => sum + s.plays, 0),
        uniques: filteredStats.reduce((sum, s) => sum + s.uniques, 0),
        completions: filteredStats.reduce((sum, s) => sum + s.completions, 0),
      },
    };
  }

  async triggerRollup() {
    // Trigger rollup for yesterday (completed day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Get all tracks that had plays yesterday
    const tracksWithPlays = await this.playRepository
      .createQueryBuilder('play')
      .select('DISTINCT play.track_id', 'track_id')
      .where('DATE(play.started_at) = :date', { date: dateStr })
      .getRawMany();

    // Enqueue rollup jobs for each track
    for (const { track_id } of tracksWithPlays) {
      await this.analyticsQueue.add('rollup', {
        trackId: track_id,
        date: dateStr,
      });
    }

    return {
      success: true,
      date: dateStr,
      tracks_queued: tracksWithPlays.length,
    };
  }

  private async verifyTrackOwnership(trackId: string, userId: string) {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${trackId} not found`);
    }

    if (track.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this track');
    }
  }

  private hashIpAddress(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }
}
