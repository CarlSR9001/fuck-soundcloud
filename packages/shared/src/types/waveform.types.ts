/**
 * Waveform entity type
 * Stores references to waveform data assets
 */
export interface Waveform {
  id: string;
  track_version_id: string;
  json_asset_id: string;
  png_asset_id: string;
  created_at: Date;
}

/**
 * Waveform JSON data structure
 */
export interface WaveformData {
  version: number;
  channels: number;
  sample_rate: number;
  samples_per_pixel: number;
  bits: number;
  length: number;
  data: number[];
}
