/**
 * Fingerprint job data
 * Triggered when a new track version is uploaded to generate audio fingerprint
 */
export interface FingerprintJobData {
  version_id: string;
}

/**
 * Fingerprint job result
 */
export interface FingerprintJobResult {
  success: boolean;
  fingerprint_id?: string;
  fingerprint?: string;
  duration?: number;
  duplicate_found?: boolean;
  duplicate_track_id?: string;
  acoustid?: string;
  error?: string;
}

/**
 * Job name constant
 */
export const FINGERPRINT_JOB = 'fingerprint' as const;
