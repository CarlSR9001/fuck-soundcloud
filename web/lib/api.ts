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

// ==================== CONTRIBUTION METHODS ====================

export interface Contribution {
  id: string;
  user_id: string | null;
  amount_cents: number;
  artist_percentage: number;
  charity_percentage: number;
  platform_percentage: number;
  charity_id: string;
  recurring: boolean;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface ContributionStats {
  total_contributed_cents: number;
  artists_supported: number;
  charity_total_cents: number;
  contributions: Contribution[];
}

/**
 * Create a new contribution
 */
export async function createContribution(data: {
  amount_cents: number;
  artist_percentage: number;
  charity_percentage: number;
  platform_percentage: number;
  charity_id: string;
  recurring: boolean;
  payment_method_id: string;
}, token: string): Promise<Contribution> {
  const response = await fetch(`${API_BASE_URL}/api/v1/contributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError('Failed to create contribution', response.status);
  }

  return response.json();
}

/**
 * Fetch user contribution history
 */
export async function fetchContributionStats(token: string): Promise<ContributionStats> {
  const response = await fetch(`${API_BASE_URL}/api/v1/contributions/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch contribution stats', response.status);
  }

  return response.json();
}

// ==================== MODERATION METHODS ====================

export interface Report {
  id: string;
  track_id: string;
  reporter_id: string | null;
  reason: string;
  evidence: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
}

export interface Strike {
  id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

export interface DMCARequest {
  id: string;
  track_id: string;
  claimant_name: string;
  claimant_email: string;
  work_description: string;
  infringement_description: string;
  status: 'pending' | 'processing' | 'takedown' | 'rejected';
  created_at: string;
}

/**
 * Submit a report
 */
export async function submitReport(data: {
  track_id: string;
  reason: string;
  evidence: string;
}, token?: string): Promise<Report> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError('Failed to submit report', response.status);
  }

  return response.json();
}

/**
 * Fetch all reports (admin only)
 */
export async function fetchReports(status?: string, token?: string): Promise<Report[]> {
  const url = status
    ? `${API_BASE_URL}/api/v1/admin/reports?status=${status}`
    : `${API_BASE_URL}/api/v1/admin/reports`;

  const response = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch reports', response.status);
  }

  return response.json();
}

/**
 * Resolve a report (admin only)
 */
export async function resolveReport(reportId: string, action: 'approve' | 'reject', token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new ApiError('Failed to resolve report', response.status);
  }
}

/**
 * Issue a strike (admin only)
 */
export async function issueStrike(userId: string, reason: string, token: string): Promise<Strike> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/strikes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, reason }),
  });

  if (!response.ok) {
    throw new ApiError('Failed to issue strike', response.status);
  }

  return response.json();
}

/**
 * Ban a user (admin only)
 */
export async function banUser(userId: string, reason: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/ban`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new ApiError('Failed to ban user', response.status);
  }
}

/**
 * Fetch DMCA requests (admin only)
 */
export async function fetchDMCARequests(token: string): Promise<DMCARequest[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/dmca`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch DMCA requests', response.status);
  }

  return response.json();
}

/**
 * Process DMCA request (admin only)
 */
export async function processDMCARequest(
  requestId: string,
  action: 'takedown' | 'reject',
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/dmca/${requestId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new ApiError('Failed to process DMCA request', response.status);
  }
}

// ==================== VERIFICATION METHODS ====================

/**
 * Verify upload ownership
 */
export async function verifyUpload(data: {
  track_id: string;
  copyright_registration?: string;
  isrc_code?: string;
  attestation: boolean;
}, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/verification/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError('Failed to verify upload', response.status);
  }
}
