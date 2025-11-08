import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { Reaction, Follow, User, Track, Playlist } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Reaction, Follow, User, Track, Playlist])],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
