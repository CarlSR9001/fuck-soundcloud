import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamController, VersionsController } from './stream.controller';
import { StreamService } from './stream.service';
import { TrackVersion, Transcode } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([TrackVersion, Transcode])],
  controllers: [StreamController, VersionsController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
