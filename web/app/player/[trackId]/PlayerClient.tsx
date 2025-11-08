'use client';

import { useState } from 'react';
import { LinerNotesDisplay, LinerNotesEditor } from '@/components';
import { updateLinerNotes } from '@/lib/liner-notes-api';
import type { LinerNotesData } from '@/lib/liner-notes-api';

interface PlayerClientProps {
  track: any;
  primaryVersion: any;
  isOwner: boolean;
}

/**
 * PlayerClient Component
 *
 * Client-side component for liner notes tab functionality
 */
export function PlayerClient({ track, primaryVersion, isOwner }: PlayerClientProps) {
  const [showLinerNotes, setShowLinerNotes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasLinerNotes =
    primaryVersion.liner_notes ||
    primaryVersion.session_date ||
    primaryVersion.session_location ||
    (primaryVersion.instruments_json && primaryVersion.instruments_json.length > 0) ||
    (primaryVersion.gear_json && primaryVersion.gear_json.length > 0);

  const handleSave = async (data: LinerNotesData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('You must be logged in to edit liner notes');
    }

    await updateLinerNotes(primaryVersion.id, data, token);
    setIsEditing(false);
    window.location.reload();
  };

  if (!hasLinerNotes && !isOwner) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowLinerNotes(!showLinerNotes)}
          className="text-lg font-medium text-neutral-900 hover:text-accent-600 transition-colors flex items-center gap-2"
        >
          <span>{showLinerNotes ? '▼' : '▶'}</span>
          Liner Notes
        </button>
        {isOwner && showLinerNotes && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
          >
            {hasLinerNotes ? 'Edit' : 'Add Liner Notes'}
          </button>
        )}
        {isOwner && isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {showLinerNotes && (
        <div>
          {isEditing ? (
            <LinerNotesEditor
              versionId={primaryVersion.id}
              initialData={{
                linerNotes: primaryVersion.liner_notes,
                sessionDate: primaryVersion.session_date,
                sessionLocation: primaryVersion.session_location,
                instruments: primaryVersion.instruments_json,
                gear: primaryVersion.gear_json,
              }}
              onSave={handleSave}
            />
          ) : (
            <LinerNotesDisplay
              linerNotes={primaryVersion.liner_notes}
              sessionDate={primaryVersion.session_date}
              sessionLocation={primaryVersion.session_location}
              instruments={primaryVersion.instruments_json}
              gear={primaryVersion.gear_json}
            />
          )}
        </div>
      )}
    </div>
  );
}
