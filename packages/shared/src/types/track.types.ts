/**
 * Track visibility levels
 */
export enum TrackVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

/**
 * Track entity type
 * Represents a music track with metadata
 */
export interface Track {
  id: string;
  owner_user_id: string;
  slug: string;
  title: string;
  description_md?: string;
  visibility: TrackVisibility;
  release_at?: Date;
  artwork_asset_id?: string;
  primary_version_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Track creation input
 */
export interface CreateTrackInput {
  title: string;
  slug?: string;
  description_md?: string;
  visibility: TrackVisibility;
  release_at?: Date;
  original_asset_id: string;
}

/**
 * Track update input
 */
export interface UpdateTrackInput {
  title?: string;
  description_md?: string;
  visibility?: TrackVisibility;
  release_at?: Date;
  artwork_asset_id?: string;
}
