import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmcaController } from './dmca.controller';
import { DmcaService } from './dmca.service';
import { DmcaRequest } from '../../entities/dmca-request.entity';
import { Track } from '../../entities/track.entity';
import { Strike } from '../../entities/strike.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DmcaRequest, Track, Strike, User])],
  controllers: [DmcaController],
  providers: [DmcaService],
  exports: [DmcaService],
})
export class DmcaModule {}
