import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DownloadsService } from './downloads.service';
import { UpdateDownloadPolicyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1/tracks/:trackId/downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Patch('policy')
  @UseGuards(JwtAuthGuard)
  async updateDownloadPolicy(
    @Param('trackId') trackId: string,
    @Body() dto: UpdateDownloadPolicyDto,
    @User('userId') userId: string,
  ) {
    return await this.downloadsService.updateDownloadPolicy(
      trackId,
      userId,
      dto,
    );
  }

  @Get('generate')
  @UseGuards(JwtAuthGuard)
  async generateDownloadUrl(
    @Param('trackId') trackId: string,
    @User('userId') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    return await this.downloadsService.generateDownloadUrl(
      trackId,
      userId,
      ipAddress,
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getDownloadHistory(
    @Param('trackId') trackId: string,
    @User('userId') userId: string,
  ) {
    return await this.downloadsService.getDownloadHistory(trackId, userId);
  }
}
