/**
 * Distribution job processor
 * Implements user-centric payment distribution model
 * Runs monthly to distribute user contributions to artists based on listening time
 */

import { Job } from 'bullmq';
import { DistributionJobData, DistributionJobResult } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import {
  Contribution,
  ArtistPayout,
  Charity,
  AnalyticsPlay,
  Track,
  User,
} from '../../../api/src/entities';
import { ContributionStatus } from '../../../api/src/entities/contribution.entity';
import { PayoutStatus } from '../../../api/src/entities/artist-payout.entity';

interface UserListeningData {
  userId: string;
  artistId: string;
  totalListenMs: number;
}

interface ArtistPayoutData {
  artistId: string;
  amountCents: number;
  contributorCount: number;
  totalListenMs: number;
}

/**
 * Get all completed contributions for a given period
 */
async function getCompletedContributions(period: string): Promise<Contribution[]> {
  const dataSource = getDataSource();
  const contributionRepo = dataSource.getRepository(Contribution);

  // Parse period (YYYY-MM)
  const [year, month] = period.split('-');
  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  return contributionRepo
    .createQueryBuilder('c')
    .where('c.status = :status', { status: ContributionStatus.COMPLETED })
    .andWhere('c.created_at >= :start', { start: startDate })
    .andWhere('c.created_at < :end', { end: endDate })
    .andWhere('c.processed_at IS NULL')
    .getMany();
}

/**
 * Get user's listening time per artist for the period
 */
async function getUserListeningData(
  userId: string,
  period: string
): Promise<UserListeningData[]> {
  const dataSource = getDataSource();

  // Parse period (YYYY-MM)
  const [year, month] = period.split('-');
  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Query analytics_play grouped by artist
  const results = await dataSource
    .createQueryBuilder(AnalyticsPlay, 'ap')
    .select('ap.user_id', 'userId')
    .addSelect('t.owner_user_id', 'artistId')
    .addSelect('SUM(ap.watch_ms)', 'totalListenMs')
    .innerJoin(Track, 't', 't.id = ap.track_id')
    .where('ap.user_id = :userId', { userId })
    .andWhere('ap.started_at >= :start', { start: startDate })
    .andWhere('ap.started_at < :end', { end: endDate })
    .groupBy('ap.user_id')
    .addGroupBy('t.owner_user_id')
    .getRawMany();

  return results.map(r => ({
    userId: r.userId,
    artistId: r.artistId,
    totalListenMs: parseInt(r.totalListenMs) || 0,
  }));
}

/**
 * Calculate artist payouts from user contribution using user-centric model
 */
function calculatePayouts(
  contribution: Contribution,
  listeningData: UserListeningData[]
): Map<string, number> {
  const payouts = new Map<string, number>();

  // Calculate total listening time
  const totalListenMs = listeningData.reduce((sum, ld) => sum + ld.totalListenMs, 0);

  // Edge case: user listened to 0 tracks = entire amount goes to platform/charity
  if (totalListenMs === 0) {
    console.log(`[Distribution] User ${contribution.user_id} has no listening data for period`);
    return payouts;
  }

  // Calculate artist portion (default 80%)
  const artistsAmount = (contribution.amount_cents * contribution.artists_percentage) / 100;

  // Split based on listening percentages
  for (const data of listeningData) {
    const percentage = data.totalListenMs / totalListenMs;
    const artistAmount = Math.floor(artistsAmount * percentage);

    const currentAmount = payouts.get(data.artistId) || 0;
    payouts.set(data.artistId, currentAmount + artistAmount);
  }

  return payouts;
}

/**
 * Create or update artist payout records
 */
async function createArtistPayouts(
  period: string,
  artistPayouts: Map<string, ArtistPayoutData>
): Promise<number> {
  const dataSource = getDataSource();
  const payoutRepo = dataSource.getRepository(ArtistPayout);
  let created = 0;

  for (const [artistId, data] of artistPayouts.entries()) {
    // Check if payout already exists for this period
    let payout = await payoutRepo.findOne({
      where: { artist_id: artistId, period },
    });

    if (payout) {
      // Update existing payout
      payout.amount_cents += data.amountCents;
      payout.contributor_count = data.contributorCount;
      payout.total_listen_ms = data.totalListenMs;
    } else {
      // Create new payout
      payout = payoutRepo.create({
        artist_id: artistId,
        period,
        amount_cents: data.amountCents,
        contributor_count: data.contributorCount,
        total_listen_ms: data.totalListenMs,
        status: PayoutStatus.PENDING,
        provider: 'stripe',
      });
      created++;
    }

    await payoutRepo.save(payout);
  }

  return created;
}

/**
 * Update charity total with contributions
 */
async function updateCharityTotals(
  contributions: Contribution[]
): Promise<number> {
  const dataSource = getDataSource();
  const charityRepo = dataSource.getRepository(Charity);
  let totalCharityAmount = 0;

  // Group contributions by charity
  const charityAmounts = new Map<string, number>();

  for (const contribution of contributions) {
    const charityAmount = (contribution.amount_cents * contribution.charity_percentage) / 100;
    totalCharityAmount += charityAmount;

    if (contribution.selected_charity_id) {
      const current = charityAmounts.get(contribution.selected_charity_id) || 0;
      charityAmounts.set(contribution.selected_charity_id, current + charityAmount);
    }
  }

  // Update charity records
  for (const [charityId, amount] of charityAmounts.entries()) {
    await charityRepo.increment(
      { id: charityId },
      'total_received_cents',
      amount
    );
  }

  return totalCharityAmount;
}

/**
 * Mark contributions as processed
 */
async function markContributionsProcessed(contributions: Contribution[]): Promise<void> {
  const dataSource = getDataSource();
  const contributionRepo = dataSource.getRepository(Contribution);

  const ids = contributions.map(c => c.id);
  await contributionRepo.update(
    ids,
    { processed_at: new Date() }
  );
}

/**
 * Process distribution job
 */
export async function processDistributionJob(
  job: Job<DistributionJobData>
): Promise<DistributionJobResult> {
  const { period } = job.data;

  console.log(`[Distribution] Processing distribution for period ${period}`);

  try {
    await job.updateProgress(5);

    // Get all completed contributions for the period
    const contributions = await getCompletedContributions(period);
    console.log(`[Distribution] Found ${contributions.length} contributions to process`);

    if (contributions.length === 0) {
      return {
        success: true,
        period,
        contributions_processed: 0,
        payouts_created: 0,
        total_distributed_cents: 0,
        charity_amount_cents: 0,
        platform_amount_cents: 0,
        artists_paid: 0,
      };
    }

    await job.updateProgress(10);

    // Aggregate artist payouts across all contributions
    const artistPayouts = new Map<string, ArtistPayoutData>();
    const contributorsByArtist = new Map<string, Set<string>>();
    let totalDistributed = 0;
    let totalPlatform = 0;

    for (const contribution of contributions) {
      // Get user's listening data for the period
      const listeningData = await getUserListeningData(contribution.user_id, period);

      // Calculate payouts for this contribution
      const payouts = calculatePayouts(contribution, listeningData);

      // Aggregate payouts by artist
      for (const [artistId, amount] of payouts.entries()) {
        const existing = artistPayouts.get(artistId);

        if (existing) {
          existing.amountCents += amount;
        } else {
          artistPayouts.set(artistId, {
            artistId,
            amountCents: amount,
            contributorCount: 0,
            totalListenMs: 0,
          });
        }

        // Track contributors per artist
        if (!contributorsByArtist.has(artistId)) {
          contributorsByArtist.set(artistId, new Set());
        }
        contributorsByArtist.get(artistId)!.add(contribution.user_id);

        // Sum up listening time
        const artistListenMs = listeningData
          .filter(ld => ld.artistId === artistId)
          .reduce((sum, ld) => sum + ld.totalListenMs, 0);
        artistPayouts.get(artistId)!.totalListenMs += artistListenMs;
      }

      // Calculate platform fee
      const platformAmount = (contribution.amount_cents * contribution.platform_percentage) / 100;
      totalPlatform += platformAmount;
      totalDistributed += contribution.amount_cents;
    }

    await job.updateProgress(50);

    // Update contributor counts
    for (const [artistId, contributors] of contributorsByArtist.entries()) {
      const payout = artistPayouts.get(artistId);
      if (payout) {
        payout.contributorCount = contributors.size;
      }
    }

    // Create artist payout records
    console.log(`[Distribution] Creating payouts for ${artistPayouts.size} artists`);
    const payoutsCreated = await createArtistPayouts(period, artistPayouts);
    await job.updateProgress(70);

    // Update charity totals
    console.log(`[Distribution] Updating charity totals`);
    const charityAmount = await updateCharityTotals(contributions);
    await job.updateProgress(85);

    // Mark contributions as processed
    console.log(`[Distribution] Marking contributions as processed`);
    await markContributionsProcessed(contributions);
    await job.updateProgress(100);

    console.log(`[Distribution] Job completed successfully`);
    return {
      success: true,
      period,
      contributions_processed: contributions.length,
      payouts_created: payoutsCreated,
      total_distributed_cents: totalDistributed,
      charity_amount_cents: charityAmount,
      platform_amount_cents: totalPlatform,
      artists_paid: artistPayouts.size,
    };
  } catch (error) {
    console.error(`[Distribution] Job failed:`, error);

    return {
      success: false,
      period,
      contributions_processed: 0,
      payouts_created: 0,
      total_distributed_cents: 0,
      charity_amount_cents: 0,
      platform_amount_cents: 0,
      artists_paid: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
