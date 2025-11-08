import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { Track, TrackVersion, Transcode } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, TrackVersion, Transcode]),
    BullModule.registerQueue(
      { name: 'transcode' },
      { name: 'waveform' },
    ),
  ],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
