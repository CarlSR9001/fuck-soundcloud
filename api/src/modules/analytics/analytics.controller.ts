import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { RecordPlayDto } from './dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  AdminGuard,
} from '../auth/guards';
import { User } from '../../common/decorators/user.decorator';

@Controller('api/v1')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('plays')
  @UseGuards(OptionalJwtAuthGuard)
  async recordPlay(
    @Body() dto: RecordPlayDto,
    @Req() req: Request,
    @User('id') userId?: string,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return await this.analyticsService.recordPlay(
      dto,
      ipAddress,
      userAgent,
      userId,
    );
  }

  @Get('tracks/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getTrackStats(@Param('id') trackId: string, @User('id') userId: string) {
    return await this.analyticsService.getTrackStats(trackId, userId);
  }

  @Get('tracks/:id/stats/daily')
  @UseGuards(JwtAuthGuard)
  async getDailyStats(
    @Param('id') trackId: string,
    @User('id') userId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return await this.analyticsService.getDailyStats(trackId, userId, daysNum);
  }

  @Post('admin/analytics/rollup')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async triggerRollup() {
    return await this.analyticsService.triggerRollup();
  }

  private getClientIp(req: Request): string {
    // Check X-Forwarded-For header (for proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback to req.ip
    return req.ip || '0.0.0.0';
  }
}
