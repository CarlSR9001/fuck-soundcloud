import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Track,
  TrackVisibility,
  Playlist,
  PlaylistVisibility,
  User,
} from '../../entities';
import { SearchDto, SearchType } from './dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Playlist)
    private playlistRepository: Repository<Playlist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async search(dto: SearchDto) {
    const { q, type, tag, limit, offset } = dto;
    const sanitizedQuery = this.sanitizeQuery(q);
    const results: any = { tracks: [], playlists: [], users: [], query: q, type };

    if (type === SearchType.ALL || type === SearchType.TRACK) {
      results.tracks = await this.searchTracks(sanitizedQuery, tag, limit, offset);
    }
    if (type === SearchType.ALL || type === SearchType.PLAYLIST) {
      results.playlists = await this.searchPlaylists(sanitizedQuery, limit, offset);
    }
    if (type === SearchType.ALL || type === SearchType.USER) {
      results.users = await this.searchUsers(sanitizedQuery, limit, offset);
    }

    return results;
  }

  async searchTracks(query: string, tagFilter?: string, limit = 20, offset = 0) {
    const qb = this.trackRepository
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.owner', 'owner')
      .leftJoinAndSelect('track.track_tags', 'track_tags')
      .leftJoinAndSelect('track_tags.tag', 'tag')
      .where('track.visibility = :visibility', { visibility: TrackVisibility.PUBLIC })
      .andWhere(
        `(to_tsvector('english', COALESCE(track.title, '')) ||
          to_tsvector('english', COALESCE(track.description_md, '')))
          @@ plainto_tsquery('english', :query)`,
        { query },
      )
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM reports
          WHERE reports.track_id = track.id
          AND reports.status IN ('pending', 'under_review')
        )`,
      );

    if (tagFilter) {
      qb.andWhere('tag.slug = :tagSlug', { tagSlug: tagFilter });
    }

    qb.addSelect(
      `ts_rank(
        setweight(to_tsvector('english', COALESCE(track.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(track.description_md, '')), 'B'),
        plainto_tsquery('english', :query))`,
      'rank',
    )
      .orderBy('rank', 'DESC')
      .addOrderBy('track.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const tracks = await qb.getMany();
    return tracks.map((track) => ({
      id: track.id,
      slug: track.slug,
      title: track.title,
      description_md: track.description_md,
      visibility: track.visibility,
      release_at: track.release_at,
      artwork_asset_id: track.artwork_asset_id,
      created_at: track.created_at,
      owner: {
        id: track.owner.id,
        handle: track.owner.handle,
        display_name: track.owner.display_name,
        avatar_asset_id: track.owner.avatar_asset_id,
      },
      tags: track.track_tags?.map((tt) => ({
        id: tt.tag.id,
        name: tt.tag.name,
        slug: tt.tag.slug,
      })),
    }));
  }

  async searchPlaylists(query: string, limit = 20, offset = 0) {
    const qb = this.playlistRepository
      .createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.owner', 'owner')
      .where('playlist.visibility = :visibility', { visibility: PlaylistVisibility.PUBLIC })
      .andWhere(
        `(to_tsvector('english', COALESCE(playlist.title, '')) ||
          to_tsvector('english', COALESCE(playlist.description_md, '')))
          @@ plainto_tsquery('english', :query)`,
        { query },
      )
      .addSelect(
        `ts_rank(
          setweight(to_tsvector('english', COALESCE(playlist.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(playlist.description_md, '')), 'B'),
          plainto_tsquery('english', :query))`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('playlist.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const playlists = await qb.getMany();
    return playlists.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      description_md: playlist.description_md,
      visibility: playlist.visibility,
      artwork_asset_id: playlist.artwork_asset_id,
      created_at: playlist.created_at,
      owner: {
        id: playlist.owner.id,
        handle: playlist.owner.handle,
        display_name: playlist.owner.display_name,
        avatar_asset_id: playlist.owner.avatar_asset_id,
      },
    }));
  }

  async searchUsers(query: string, limit = 20, offset = 0) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where(
        `(to_tsvector('english', COALESCE(user.handle, '')) ||
          to_tsvector('english', COALESCE(user.display_name, '')))
          @@ plainto_tsquery('english', :query)`,
        { query },
      )
      .addSelect(
        `ts_rank(
          setweight(to_tsvector('english', COALESCE(user.handle, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(user.display_name, '')), 'B'),
          plainto_tsquery('english', :query))`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('user.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const users = await qb.getMany();
    return users.map((user) => ({
      id: user.id,
      handle: user.handle,
      display_name: user.display_name,
      bio: user.bio,
      avatar_asset_id: user.avatar_asset_id,
      created_at: user.created_at,
    }));
  }

  private sanitizeQuery(query: string): string {
    return query.replace(/[^\w\s'-]/g, ' ').trim().replace(/\s+/g, ' ');
  }
}
