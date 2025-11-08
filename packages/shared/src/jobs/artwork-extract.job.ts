/**
 * Artwork extraction job data
 * Extracts embedded cover art from audio file
 */
export interface ArtworkExtractJobData {
  version_id: string;
  original_asset_id: string;
}

/**
 * Artwork extract job result
 */
export interface ArtworkExtractJobResult {
  success: boolean;
  artwork_asset_id?: string;
  thumbnail_asset_id?: string;
  error?: string;
}

/**
 * Job name constant
 */
export const ARTWORK_EXTRACT_JOB = 'artwork-extract' as const;
