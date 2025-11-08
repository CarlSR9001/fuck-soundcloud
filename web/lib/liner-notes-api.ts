/**
 * Liner Notes API Functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LinerNotesData {
  liner_notes?: string;
  session_date?: string;
  session_location?: string;
  instruments?: string[];
  gear?: string[];
}

/**
 * Update liner notes for a track version
 */
export async function updateLinerNotes(
  versionId: string,
  data: LinerNotesData,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/versions/${versionId}/liner-notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update liner notes' }));
    throw new Error(error.message || 'Failed to update liner notes');
  }

  return response.json();
}
