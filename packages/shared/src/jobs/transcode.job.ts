import { TranscodeFormat } from '../types/transcode.types';

/**
 * Transcode job data
 * Triggered when a new track version is uploaded
 */
export interface TranscodeJobData {
  version_id: string;
  format: TranscodeFormat;
}

/**
 * Transcode job result
 */
export interface TranscodeJobResult {
  success: boolean;
  transcode_id: string;
  playlist_asset_id?: string;
  segment_count?: number;
  error?: string;
}

/**
 * Job name constant
 */
export const TRANSCODE_JOB = 'transcode' as const;
