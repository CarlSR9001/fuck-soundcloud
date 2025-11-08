/**
 * Supported transcode output formats
 */
export enum TranscodeFormat {
  HLS_OPUS = 'hls_opus',
  HLS_AAC = 'hls_aac',
  HLS_ALAC = 'hls_alac',
  MP3_320 = 'mp3_320',
}

/**
 * Transcode processing status
 */
export enum TranscodeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

/**
 * Transcode entity type
 * Represents a transcoded version of a track
 */
export interface Transcode {
  id: string;
  track_version_id: string;
  format: TranscodeFormat;
  playlist_asset_id?: string;
  segment_prefix_key?: string;
  status: TranscodeStatus;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Transcode creation input
 */
export interface CreateTranscodeInput {
  track_version_id: string;
  format: TranscodeFormat;
}
