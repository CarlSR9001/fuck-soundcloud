/**
 * MP3 Transcode job data
 * Triggered when a lossy download is requested
 */
export interface Mp3TranscodeJobData {
  version_id: string;
  track_id: string;
}

/**
 * MP3 Transcode job result
 */
export interface Mp3TranscodeJobResult {
  success: boolean;
  bucket: string;
  key: string;
  error?: string;
}

/**
 * Job name constant
 */
export const MP3_TRANSCODE_JOB = 'mp3-transcode' as const;
