import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreviewLinksController } from './preview-links.controller';
import { PreviewLinksService } from './preview-links.service';
import { PreviewLink, Track } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([PreviewLink, Track])],
  controllers: [PreviewLinksController],
  providers: [PreviewLinksService],
  exports: [PreviewLinksService],
})
export class PreviewLinksModule {}
