import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist, PlaylistItem, Track } from '../../entities';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
  ReorderDto,
} from './dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistItem)
    private playlistItemRepository: Repository<PlaylistItem>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async create(ownerId: string, dto: CreatePlaylistDto) {
    const playlist = this.playlistRepository.create({
      owner_user_id: ownerId,
      ...dto,
    });

    return await this.playlistRepository.save(playlist);
  }

  async findOne(id: string) {
    const playlist = await this.playlistRepository.findOne({
      where: { id },
      relations: ['items', 'items.track', 'owner'],
    });

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }

    // Sort items by position
    if (playlist.items) {
      playlist.items.sort((a, b) => a.position - b.position);
    }

    return playlist;
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    const playlist = await this.findOne(id);

    // Check ownership
    if (playlist.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this playlist');
    }

    Object.assign(playlist, dto);
    return await this.playlistRepository.save(playlist);
  }

  async delete(id: string, userId: string) {
    const playlist = await this.findOne(id);

    // Check ownership
    if (playlist.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this playlist');
    }

    await this.playlistRepository.remove(playlist);
    return { message: 'Playlist deleted successfully' };
  }

  async addTrack(id: string, userId: string, dto: AddTrackDto) {
    const playlist = await this.findOne(id);
    if (playlist.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this playlist');
    }

    const track = await this.trackRepository.findOne({
      where: { id: dto.track_id },
    });
    if (!track) {
      throw new NotFoundException(`Track with ID ${dto.track_id} not found`);
    }

    const existingItem = await this.playlistItemRepository.findOne({
      where: { playlist_id: id, track_id: dto.track_id },
    });
    if (existingItem) {
      throw new BadRequestException('Track already exists in this playlist');
    }

    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.playlistItemRepository
        .createQueryBuilder('item')
        .where('item.playlist_id = :playlistId', { playlistId: id })
        .select('MAX(item.position)', 'max')
        .getRawOne();
      position = (maxPosition?.max ?? -1) + 1;
    } else {
      await this.playlistItemRepository
        .createQueryBuilder()
        .update(PlaylistItem)
        .set({ position: () => 'position + 1' })
        .where('playlist_id = :playlistId', { playlistId: id })
        .andWhere('position >= :position', { position })
        .execute();
    }

    const item = this.playlistItemRepository.create({
      playlist_id: id,
      track_id: dto.track_id,
      position,
    });
    await this.playlistItemRepository.save(item);
    return await this.findOne(id);
  }

  async removeTrack(id: string, trackId: string, userId: string) {
    const playlist = await this.findOne(id);
    if (playlist.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this playlist');
    }

    const item = await this.playlistItemRepository.findOne({
      where: { playlist_id: id, track_id: trackId },
    });
    if (!item) {
      throw new NotFoundException('Track not found in this playlist');
    }

    const removedPosition = item.position;
    await this.playlistItemRepository.remove(item);

    await this.playlistItemRepository
      .createQueryBuilder()
      .update(PlaylistItem)
      .set({ position: () => 'position - 1' })
      .where('playlist_id = :playlistId', { playlistId: id })
      .andWhere('position > :position', { position: removedPosition })
      .execute();

    return await this.findOne(id);
  }

  async reorder(id: string, userId: string, dto: ReorderDto) {
    const playlist = await this.findOne(id);
    if (playlist.owner_user_id !== userId) {
      throw new ForbiddenException('You do not own this playlist');
    }

    const trackIds = dto.track_positions.map((tp) => tp.track_id);
    const items = await this.playlistItemRepository.find({
      where: { playlist_id: id },
    });
    const playlistTrackIds = items.map((item) => item.track_id);

    for (const trackId of trackIds) {
      if (!playlistTrackIds.includes(trackId)) {
        throw new BadRequestException(
          `Track ${trackId} does not belong to this playlist`,
        );
      }
    }

    for (const trackPosition of dto.track_positions) {
      await this.playlistItemRepository
        .createQueryBuilder()
        .update(PlaylistItem)
        .set({ position: trackPosition.position })
        .where('playlist_id = :playlistId', { playlistId: id })
        .andWhere('track_id = :trackId', { trackId: trackPosition.track_id })
        .execute();
    }

    return await this.findOne(id);
  }
}
