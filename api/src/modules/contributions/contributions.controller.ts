/**
 * Contributions controller - API endpoints for voluntary contributions
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { ContributionsService } from './contributions.service';
import { DistributionService } from './distribution.service';
import { CreateContributionDto } from './dto';

@Controller('api/v1/contributions')
@UseGuards(JwtAuthGuard)
export class ContributionsController {
  constructor(
    private contributionsService: ContributionsService,
    private distributionService: DistributionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContribution(
    @User('userId') userId: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.contributionsService.createContribution(userId, dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async listMyContributions(@User('userId') userId: string) {
    return this.contributionsService.listMyContributions(userId);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getMyStats(@User('userId') userId: string) {
    return this.contributionsService.getMyStats(userId);
  }
}
