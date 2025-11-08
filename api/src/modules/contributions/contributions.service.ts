/**
 * Contributions service - handles voluntary contributions and user-centric distribution
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Contribution,
  ContributionType,
  ContributionStatus,
} from '@/entities/contribution.entity';
import { Charity } from '@/entities/charity.entity';
import { ArtistPayout, PayoutStatus } from '@/entities/artist-payout.entity';
import { AnalyticsPlay } from '@/entities/analytics-play.entity';
import { PaymentProvider } from '../payments/interfaces/payment-provider.interface';
import { CreateContributionDto, ContributionStatsDto } from './dto';

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Contribution)
    private contributionRepo: Repository<Contribution>,
    @InjectRepository(Charity)
    private charityRepo: Repository<Charity>,
    @InjectRepository(ArtistPayout)
    private payoutRepo: Repository<ArtistPayout>,
    @InjectRepository(AnalyticsPlay)
    private playRepo: Repository<AnalyticsPlay>,
    @Inject('PAYMENT_PROVIDER')
    private paymentProvider: PaymentProvider,
  ) {}

  async createContribution(userId: string, dto: CreateContributionDto): Promise<any> {
    // Validate split percentages
    const artistsPct = dto.artists_percentage ?? 80;
    const charityPct = dto.charity_percentage ?? 10;
    const platformPct = dto.platform_percentage ?? 10;

    if (artistsPct + charityPct + platformPct !== 100) {
      throw new BadRequestException('Split percentages must sum to 100');
    }

    // Validate charity if specified
    if (dto.selected_charity_id) {
      const charity = await this.charityRepo.findOne({
        where: { id: dto.selected_charity_id, is_active: true },
      });
      if (!charity) {
        throw new NotFoundException('Charity not found or inactive');
      }
    }

    // Create payment intent with Stripe
    const paymentIntent = await this.paymentProvider.createPaymentIntent(
      dto.amount_cents / 100, // Convert cents to dollars
      'usd',
      {
        user_id: userId,
        type: dto.type || ContributionType.ONE_TIME,
      },
    );

    // Create contribution record
    const contribution = this.contributionRepo.create({
      user_id: userId,
      amount_cents: dto.amount_cents,
      type: dto.type || ContributionType.ONE_TIME,
      status: ContributionStatus.PENDING,
      payment_intent_id: paymentIntent.id,
      provider: 'stripe',
      artists_percentage: artistsPct,
      charity_percentage: charityPct,
      platform_percentage: platformPct,
      selected_charity_id: dto.selected_charity_id,
    });

    await this.contributionRepo.save(contribution);

    return {
      contribution_id: contribution.id,
      client_secret: paymentIntent.client_secret,
      amount_cents: contribution.amount_cents,
    };
  }

  async listMyContributions(userId: string): Promise<Contribution[]> {
    return this.contributionRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getMyStats(userId: string): Promise<ContributionStatsDto> {
    const contributions = await this.contributionRepo.find({
      where: { user_id: userId, status: ContributionStatus.COMPLETED },
    });

    const totalContributed = contributions.reduce(
      (sum, c) => sum + Number(c.amount_cents),
      0,
    );

    const totalToArtists = contributions.reduce(
      (sum, c) => sum + (Number(c.amount_cents) * c.artists_percentage) / 100,
      0,
    );

    const totalToCharity = contributions.reduce(
      (sum, c) => sum + (Number(c.amount_cents) * c.charity_percentage) / 100,
      0,
    );

    const totalToPlatform = contributions.reduce(
      (sum, c) => sum + (Number(c.amount_cents) * c.platform_percentage) / 100,
      0,
    );

    // Find artists supported (unique artist IDs from play events)
    const plays = await this.playRepo
      .createQueryBuilder('play')
      .innerJoin('play.track', 'track')
      .select('DISTINCT track.owner_user_id')
      .where('play.user_id = :userId', { userId })
      .getRawMany();

    const artistsSupportedCount = plays.length;

    // Find favorite charity
    const charityContributions = contributions.filter((c) => c.selected_charity_id);
    const charityCounts = new Map<string, number>();

    for (const contrib of charityContributions) {
      const count = charityCounts.get(contrib.selected_charity_id) || 0;
      charityCounts.set(contrib.selected_charity_id, count + 1);
    }

    let favoriteCharity;
    if (charityCounts.size > 0) {
      const [topCharityId] = [...charityCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      const charity = await this.charityRepo.findOne({ where: { id: topCharityId } });
      if (charity) {
        favoriteCharity = {
          id: charity.id,
          name: charity.name,
          slug: charity.slug,
        };
      }
    }

    return {
      total_contributed_cents: totalContributed,
      total_to_artists_cents: totalToArtists,
      total_to_charity_cents: totalToCharity,
      total_to_platform_cents: totalToPlatform,
      contribution_count: contributions.length,
      artists_supported_count: artistsSupportedCount,
      favorite_charity: favoriteCharity,
    };
  }
}
