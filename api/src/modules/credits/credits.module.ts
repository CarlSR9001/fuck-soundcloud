import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credit, Track } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Credit, Track])],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
