import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import {
  Track,
  Download,
  CopyrightAttestation,
  TrackVersion,
} from '../../entities';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Track,
      Download,
      CopyrightAttestation,
      TrackVersion,
    ]),
    BullModule.registerQueue({ name: 'mp3-transcode' }),
    StorageModule,
  ],
  controllers: [DownloadsController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
