/**
 * User-centric distribution engine
 * Calculates artist payouts based on listening time per user
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Contribution, ContributionStatus } from '@/entities/contribution.entity';
import { ArtistPayout, PayoutStatus } from '@/entities/artist-payout.entity';
import { AnalyticsPlay } from '@/entities/analytics-play.entity';
import { Charity } from '@/entities/charity.entity';

interface ArtistShare {
  artistId: string;
  listenMs: number;
  contributorCount: number;
  amountCents: number;
}

@Injectable()
export class DistributionService {
  constructor(
    @InjectRepository(Contribution)
    private contributionRepo: Repository<Contribution>,
    @InjectRepository(ArtistPayout)
    private payoutRepo: Repository<ArtistPayout>,
    @InjectRepository(AnalyticsPlay)
    private playRepo: Repository<AnalyticsPlay>,
    @InjectRepository(Charity)
    private charityRepo: Repository<Charity>,
  ) {}

  /**
   * Distribute monthly payouts based on user-centric model
   * Each user's contribution is split among artists THEY listen to
   */
  async distributeMonthlyPayouts(period: string): Promise<{
    artists_paid: number;
    total_distributed_cents: number;
    charity_distributed_cents: number;
  }> {
    // Parse period (YYYY-MM)
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all completed contributions for this period
    const contributions = await this.contributionRepo.find({
      where: {
        status: ContributionStatus.COMPLETED,
        processed_at: Between(startDate, endDate),
      },
    });

    if (contributions.length === 0) {
      return { artists_paid: 0, total_distributed_cents: 0, charity_distributed_cents: 0 };
    }

    // Calculate artist shares per user
    const artistShares = new Map<string, ArtistShare>();

    for (const contribution of contributions) {
      const artistPool = (contribution.amount_cents * contribution.artists_percentage) / 100;

      // Get user's listening history for this period
      const plays = await this.playRepo
        .createQueryBuilder('play')
        .innerJoin('play.track', 'track')
        .select('track.owner_user_id', 'artistId')
        .addSelect('SUM(play.watch_ms)', 'totalMs')
        .where('play.user_id = :userId', { userId: contribution.user_id })
        .andWhere('play.started_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('track.owner_user_id')
        .getRawMany();

      const totalListenMs = plays.reduce((sum, p) => sum + Number(p.totalMs), 0);

      if (totalListenMs === 0) continue;

      // Distribute this user's artist pool based on their listening
      for (const play of plays) {
        const artistId = play.artistId;
        const listenMs = Number(play.totalMs);
        const artistShare = (artistPool * listenMs) / totalListenMs;

        const existing = artistShares.get(artistId);
        if (existing) {
          existing.amountCents += artistShare;
          existing.listenMs += listenMs;
          existing.contributorCount += 1;
        } else {
          artistShares.set(artistId, {
            artistId,
            listenMs,
            contributorCount: 1,
            amountCents: artistShare,
          });
        }
      }
    }

    // Create ArtistPayout records
    const payouts: ArtistPayout[] = [];
    for (const [artistId, share] of artistShares) {
      const payout = this.payoutRepo.create({
        artist_id: artistId,
        period,
        amount_cents: Math.round(share.amountCents),
        contributor_count: share.contributorCount,
        total_listen_ms: share.listenMs,
        status: PayoutStatus.PENDING,
        provider: 'stripe',
      });
      payouts.push(payout);
    }

    await this.payoutRepo.save(payouts);

    // Calculate charity distribution
    const charityDistribution = contributions.reduce(
      (sum, c) => sum + (c.amount_cents * c.charity_percentage) / 100,
      0,
    );

    // Update charity totals
    for (const contribution of contributions) {
      if (contribution.selected_charity_id) {
        const charityAmount = (contribution.amount_cents * contribution.charity_percentage) / 100;
        await this.charityRepo.increment(
          { id: contribution.selected_charity_id },
          'total_received_cents',
          charityAmount,
        );
      }
    }

    const totalDistributed = payouts.reduce((sum, p) => sum + Number(p.amount_cents), 0);

    return {
      artists_paid: payouts.length,
      total_distributed_cents: totalDistributed,
      charity_distributed_cents: charityDistribution,
    };
  }
}
