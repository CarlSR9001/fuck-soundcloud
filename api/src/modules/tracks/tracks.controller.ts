import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto, UpdateTrackDto, CreateVersionDto } from './dto';

@Controller('api/v1/tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post()
  async create(@Body() dto: CreateTrackDto, @Request() req: any) {
    // TODO: Get user ID from JWT token after auth is implemented
    // For now, we'll use a placeholder
    const ownerId = req.user?.id || 'temp-user-id';
    return await this.tracksService.create(ownerId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.tracksService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTrackDto) {
    return await this.tracksService.update(id, dto);
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ) {
    return await this.tracksService.createVersion(id, dto);
  }
}
