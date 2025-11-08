'use client';

import { useRouter } from 'next/navigation';
import { Track, TrackVersion } from '@/lib/api';
import { VersionSwitcher, NewVersionButton } from '@/components';

interface VersionControlsProps {
  track: Track;
  currentVersion: TrackVersion;
  isOwner: boolean;
}

/**
 * Version Controls Component
 *
 * Client-side component for version switching and new version upload.
 * Keeps player page server component while enabling interactive features.
 */
export function VersionControls({ track, currentVersion, isOwner }: VersionControlsProps) {
  const router = useRouter();

  const handleVersionChange = (versionId: string) => {
    router.push(`/player/${track.id}?v=${versionId}`);
  };

  const handleVersionCreated = () => {
    router.refresh();
  };

  const readyVersions = track.versions.filter((v) => v.status === 'ready');

  if (readyVersions.length <= 1 && !isOwner) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {readyVersions.length > 1 && (
        <VersionSwitcher
          versions={readyVersions}
          currentVersionId={currentVersion.id}
          onVersionChange={handleVersionChange}
        />
      )}
      {isOwner && (
        <NewVersionButton
          trackId={track.id}
          currentVersionCount={track.versions.length}
          onVersionCreated={handleVersionCreated}
        />
      )}
    </div>
  );
}
