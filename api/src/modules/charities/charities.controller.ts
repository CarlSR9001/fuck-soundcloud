/**
 * Charities controller - API endpoints for charity organizations
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CharitiesService } from './charities.service';
import { CreateCharityDto } from './dto';

@Controller('api/v1/charities')
export class CharitiesController {
  constructor(private charitiesService: CharitiesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listActiveCharities() {
    return this.charitiesService.listActiveCharities();
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getCharityBySlug(@Param('slug') slug: string) {
    return this.charitiesService.getCharityBySlug(slug);
  }
}

@Controller('api/v1/admin/charities')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CharitiesAdminController {
  constructor(private charitiesService: CharitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCharity(@Body() dto: CreateCharityDto) {
    return this.charitiesService.createCharity(dto);
  }
}
