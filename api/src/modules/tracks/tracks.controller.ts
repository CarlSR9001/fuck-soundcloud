import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TracksService } from './tracks.service';
import {
  CreateTrackDto,
  UpdateTrackDto,
  CreateVersionDto,
  UpdateLinerNotesDto,
  ScheduleTrackDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1/tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateTrackDto,
    @User('userId') ownerId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return await this.tracksService.create(ownerId, dto, ipAddress as string, userAgent);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.tracksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateTrackDto, @User('userId') userId: string) {
    return await this.tracksService.update(id, dto);
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @User('userId') userId: string,
  ) {
    return await this.tracksService.createVersion(id, dto);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard)
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleTrackDto,
    @User('userId') userId: string,
  ) {
    const publishedAt = dto.published_at ? new Date(dto.published_at) : null;
    const embargoUntil = dto.embargo_until ? new Date(dto.embargo_until) : null;
    return await this.tracksService.schedule(id, publishedAt, embargoUntil, userId);
  }
}

@Controller('api/v1/versions')
export class VersionsController {
  constructor(private readonly tracksService: TracksService) {}

  @Patch(':id/liner-notes')
  @UseGuards(JwtAuthGuard)
  async updateLinerNotes(
    @Param('id') id: string,
    @Body() dto: UpdateLinerNotesDto,
    @User('userId') userId: string,
  ) {
    return await this.tracksService.updateLinerNotes(id, userId, dto);
  }
}
