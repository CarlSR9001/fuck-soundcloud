import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
  ReorderDto,
} from './dto';

@Controller('api/v1/playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  async create(@Body() dto: CreatePlaylistDto, @Request() req: any) {
    // TODO: Get user ID from JWT token after auth is implemented
    const ownerId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.create(ownerId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.playlistsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.update(id, userId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.delete(id, userId);
  }

  @Post(':id/tracks')
  async addTrack(
    @Param('id') id: string,
    @Body() dto: AddTrackDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.addTrack(id, userId, dto);
  }

  @Delete(':id/tracks/:trackId')
  async removeTrack(
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.removeTrack(id, trackId, userId);
  }

  @Put(':id/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'temp-user-id';
    return await this.playlistsService.reorder(id, userId, dto);
  }
}
