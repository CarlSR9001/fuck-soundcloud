/**
 * Loudness analysis job data
 * Performs EBU R128 loudness analysis
 */
export interface LoudnessJobData {
  version_id: string;
  original_asset_id: string;
}

/**
 * Loudness job result
 */
export interface LoudnessJobResult {
  success: boolean;
  integrated_lufs?: number;
  true_peak?: number;
  lra?: number;
  error?: string;
}

/**
 * Job name constant
 */
export const LOUDNESS_JOB = 'loudness' as const;
