/**
 * Waveform generation job data
 */
export interface WaveformJobData {
  version_id: string;
}

/**
 * Waveform job result
 */
export interface WaveformJobResult {
  success: boolean;
  waveform_id?: string;
  json_asset_id?: string;
  png_asset_id?: string;
  error?: string;
}

/**
 * Job name constant
 */
export const WAVEFORM_JOB = 'waveform' as const;
