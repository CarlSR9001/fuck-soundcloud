import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Charity } from '@/entities/charity.entity';
import { CharitiesService } from './charities.service';
import { CharitiesController, CharitiesAdminController } from './charities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Charity])],
  controllers: [CharitiesController, CharitiesAdminController],
  providers: [CharitiesService],
  exports: [CharitiesService],
})
export class CharitiesModule {}
