/**
 * Analytics rollup processor
 * Aggregates play events into daily summaries
 */

import { Job } from 'bullmq';
import { AnalyticsRollupJobData, AnalyticsRollupJobResult } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import { AnalyticsPlay } from '../../../api/src/entities/analytics-play.entity';
import { AnalyticsDaily } from '../../../api/src/entities/analytics-daily.entity';

/**
 * Process analytics rollup job
 */
export async function processAnalyticsRollupJob(
  job: Job<AnalyticsRollupJobData>
): Promise<AnalyticsRollupJobResult> {
  const { day } = job.data;

  console.log(`[Analytics] Processing rollup for day ${day}, job ${job.id}`);

  try {
    await job.updateProgress(10);

    const dataSource = getDataSource();
    const playRepo = dataSource.getRepository(AnalyticsPlay);
    const dailyRepo = dataSource.getRepository(AnalyticsDaily);

    // Query play events for the given day
    const startOfDay = new Date(day + 'T00:00:00Z');
    const endOfDay = new Date(day + 'T23:59:59.999Z');

    await job.updateProgress(20);

    // Get all tracks with plays on this day
    const tracksWithPlays = await playRepo
      .createQueryBuilder('play')
      .select('play.track_id', 'track_id')
      .where('play.started_at >= :startOfDay', { startOfDay })
      .andWhere('play.started_at <= :endOfDay', { endOfDay })
      .groupBy('play.track_id')
      .getRawMany();

    console.log(
      `[Analytics] Found ${tracksWithPlays.length} tracks with plays on ${day}`
    );

    await job.updateProgress(40);

    let processedCount = 0;

    // Process each track
    for (const { track_id } of tracksWithPlays) {
      // Aggregate play data for this track on this day
      const aggregation = await playRepo
        .createQueryBuilder('play')
        .select('COUNT(*)', 'plays')
        .addSelect('COUNT(DISTINCT COALESCE(play.user_id, play.ip_hash))', 'uniques')
        .addSelect('SUM(CASE WHEN play.completed THEN 1 ELSE 0 END)', 'completions')
        .where('play.track_id = :track_id', { track_id })
        .andWhere('play.started_at >= :startOfDay', { startOfDay })
        .andWhere('play.started_at <= :endOfDay', { endOfDay })
        .getRawOne();

      // Find or create daily record
      let dailyRecord = await dailyRepo.findOne({
        where: { track_id, day },
      });

      if (!dailyRecord) {
        dailyRecord = dailyRepo.create({
          track_id,
          day,
          plays: 0,
          uniques: 0,
          likes: 0,
          reposts: 0,
          downloads: 0,
          completions: 0,
        });
      }

      // Update aggregated values
      dailyRecord.plays = parseInt(aggregation.plays) || 0;
      dailyRecord.uniques = parseInt(aggregation.uniques) || 0;
      dailyRecord.completions = parseInt(aggregation.completions) || 0;

      await dailyRepo.save(dailyRecord);
      processedCount++;

      console.log(
        `[Analytics] Track ${track_id} on ${day}: ${dailyRecord.plays} plays, ${dailyRecord.uniques} uniques`
      );
    }

    await job.updateProgress(90);

    // Optionally: archive or delete old play records (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleteResult = await playRepo
      .createQueryBuilder()
      .delete()
      .where('started_at < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute();

    if (deleteResult.affected && deleteResult.affected > 0) {
      console.log(
        `[Analytics] Archived ${deleteResult.affected} old play records`
      );
    }

    await job.updateProgress(100);

    console.log(
      `[Analytics] Successfully rolled up ${processedCount} tracks for ${day}`
    );

    return {
      success: true,
      tracks_processed: processedCount,
      records_archived: deleteResult.affected || 0,
    };
  } catch (error: any) {
    console.error(`[Analytics] Error in job ${job.id}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error during analytics rollup',
      tracks_processed: 0,
      records_archived: 0,
    };
  }
}
