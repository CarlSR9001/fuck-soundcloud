import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StemsController } from './stems.controller';
import { StemsService } from './stems.service';
import { Stem, TrackVersion, Track, Asset } from '../../entities';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stem, TrackVersion, Track, Asset]),
    StorageModule,
  ],
  controllers: [StemsController],
  providers: [StemsService],
  exports: [StemsService],
})
export class StemsModule {}
