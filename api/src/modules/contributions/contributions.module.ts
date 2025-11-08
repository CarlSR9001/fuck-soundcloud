import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contribution } from '@/entities/contribution.entity';
import { Charity } from '@/entities/charity.entity';
import { ArtistPayout } from '@/entities/artist-payout.entity';
import { AnalyticsPlay } from '@/entities/analytics-play.entity';
import { PaymentsModule } from '../payments';
import { ContributionsService } from './contributions.service';
import { DistributionService } from './distribution.service';
import { ContributionsController } from './contributions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contribution, Charity, ArtistPayout, AnalyticsPlay]),
    PaymentsModule,
  ],
  controllers: [ContributionsController],
  providers: [ContributionsService, DistributionService],
  exports: [ContributionsService, DistributionService],
})
export class ContributionsModule {}
