/**
 * API Client Utilities
 *
 * Centralized API client for interacting with the backend.
 * Uses NEXT_PUBLIC_API_URL from environment variables.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Track with versions and transcodes
 */
export interface Track {
  id: string;
  slug: string;
  title: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'private';
  release_at?: string;
  artwork_url?: string;
  primary_version_id: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  versions: TrackVersion[];
}

/**
 * Track version with transcodes
 */
export interface TrackVersion {
  id: string;
  track_id: string;
  version_label: string;
  original_asset_id: string;
  duration_ms: number;
  loudness_lufs?: number;
  sample_rate: number;
  channels: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  transcodes: Transcode[];
}

/**
 * Transcode details
 */
export interface Transcode {
  id: string;
  track_version_id: string;
  format: 'hls_opus' | 'hls_aac' | 'hls_alac' | 'mp3_320';
  playlist_url?: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
}

/**
 * Waveform data structure
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

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  bio: string | null;
  avatar_asset_id: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  tracks: Track[];
}

/**
 * API Error
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch track with versions and transcodes
 *
 * @param id Track ID
 * @returns Track object with versions and transcodes
 */
export async function fetchTrack(id: string): Promise<Track> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/tracks/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch track: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Get signed HLS playlist URL for a track version
 *
 * @param versionId Track version ID
 * @returns Signed HLS playlist URL
 */
export async function fetchStreamUrl(versionId: string): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stream/${versionId}.m3u8`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch stream URL: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    // Return the URL itself (Nginx will handle the signed URL redirect)
    return response.url;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Fetch waveform JSON data for a track version
 *
 * @param versionId Track version ID
 * @returns Waveform data object
 */
export async function fetchWaveform(versionId: string): Promise<WaveformData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/versions/${versionId}/waveform`,
      {
        cache: 'force-cache', // Waveforms don't change
      }
    );

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch waveform: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Fetch user profile by handle
 *
 * @param handle User handle (without @)
 * @returns User profile with tracks
 */
export async function fetchUserProfile(handle: string): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${handle}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch user profile: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}
