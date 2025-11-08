/**
 * Playlist entity type
 */
export interface Playlist {
  id: string;
  owner_user_id: string;
  title: string;
  description_md?: string;
  visibility: 'public' | 'unlisted' | 'private';
  artwork_asset_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Playlist item (track in playlist)
 */
export interface PlaylistItem {
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: Date;
}

/**
 * Playlist creation input
 */
export interface CreatePlaylistInput {
  title: string;
  description_md?: string;
  visibility: 'public' | 'unlisted' | 'private';
  artwork_asset_id?: string;
}

/**
 * Playlist update input
 */
export interface UpdatePlaylistInput {
  title?: string;
  description_md?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  artwork_asset_id?: string;
}
