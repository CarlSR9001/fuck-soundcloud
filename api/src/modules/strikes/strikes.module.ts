import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrikesController } from './strikes.controller';
import { StrikesService } from './strikes.service';
import { Strike } from '../../entities/strike.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Strike, User])],
  controllers: [StrikesController],
  providers: [StrikesService],
  exports: [StrikesService],
})
export class StrikesModule {}
