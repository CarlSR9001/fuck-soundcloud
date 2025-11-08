/**
 * Track version processing status
 */
export enum TrackVersionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

/**
 * Track version entity type
 * Represents a specific version/mix of a track
 */
export interface TrackVersion {
  id: string;
  track_id: string;
  version_label: string;
  original_asset_id: string;
  duration_ms?: number;
  loudness_lufs?: number;
  sample_rate?: number;
  channels?: number;
  status: TrackVersionStatus;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Track version creation input
 */
export interface CreateTrackVersionInput {
  track_id: string;
  version_label: string;
  original_asset_id: string;
}

/**
 * Track version metadata update
 */
export interface UpdateTrackVersionMetadata {
  duration_ms: number;
  sample_rate: number;
  channels: number;
  loudness_lufs?: number;
}
