import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchTrack, ApiError } from '@/lib/api';
import { AudioPlayer, ShareButton, StemsPanel } from '@/components';
import { Container } from '@/components';
import { branding } from '@/config';
import { PlayerClient } from './PlayerClient';
import { VersionControls } from './VersionControls';

interface PlayerPageProps {
  params: {
    trackId: string;
  };
}

/**
 * Generate metadata for the track player page
 */
export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  try {
    const track = await fetchTrack(params.trackId);

    return {
      title: `${track.title} - ${branding.name}`,
      description: track.description || `Listen to ${track.title} on ${branding.name}`,
      openGraph: {
        title: track.title,
        description: track.description || undefined,
        images: track.artwork_url ? [track.artwork_url] : undefined,
        type: 'music.song',
      },
    };
  } catch (error) {
    return {
      title: `Track Not Found - ${branding.name}`,
    };
  }
}

/**
 * Track Player Page (Server Component)
 *
 * Fetches track data server-side and passes to client component.
 */
export default async function PlayerPage({ params, searchParams }: PlayerPageProps & { searchParams: { v?: string } }) {
  let track;

  try {
    track = await fetchTrack(params.trackId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Get version from URL param or use primary version
  const versionId = searchParams?.v;
  const primaryVersion = versionId
    ? track.versions.find((v) => v.id === versionId && v.status === 'ready') ||
      track.versions.find((v) => v.id === track.primary_version_id) ||
      track.versions[0]
    : track.versions.find((v) => v.id === track.primary_version_id) || track.versions[0];

  if (!primaryVersion) {
    return (
      <Container size="md" className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">
            Track Processing
          </h1>
          <p className="text-neutral-600">
            This track is still being processed. Please check back later.
          </p>
        </div>
      </Container>
    );
  }

  // Check if track has a ready HLS transcode
  const hlsTranscode = primaryVersion.transcodes.find(
    (t) => t.format === 'hls_opus' && t.status === 'ready'
  );

  if (!hlsTranscode) {
    return (
      <Container size="md" className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">
            {track.title}
          </h1>
          <p className="text-neutral-600">
            This track is still being transcoded. Please check back shortly.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Status: {primaryVersion.status}
          </p>
        </div>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Container size="lg" className="py-8">
        {/* Track Header */}
        <div className="mb-8">
          <div className="flex gap-6 items-start">
            {/* Artwork */}
            {track.artwork_url && (
              <div className="flex-shrink-0">
                <img
                  src={track.artwork_url}
                  alt={`${track.title} artwork`}
                  className="w-48 h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Metadata */}
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-neutral-900 mb-2">
                {track.title}
              </h1>
              {track.description && (
                <p className="text-lg text-neutral-600 whitespace-pre-wrap">
                  {track.description}
                </p>
              )}
              <div className="mt-4 flex gap-4 text-sm text-neutral-500">
                <span>
                  Duration: {Math.floor(primaryVersion.duration_ms / 60000)}:
                  {String(Math.floor((primaryVersion.duration_ms % 60000) / 1000)).padStart(2, '0')}
                </span>
                {primaryVersion.sample_rate && (
                  <span>{(primaryVersion.sample_rate / 1000).toFixed(1)} kHz</span>
                )}
                {primaryVersion.channels && (
                  <span>
                    {primaryVersion.channels === 1 ? 'Mono' : primaryVersion.channels === 2 ? 'Stereo' : `${primaryVersion.channels} channels`}
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <ShareButton trackId={track.id} />
                <VersionControls
                  track={track}
                  currentVersion={primaryVersion}
                  isOwner={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <AudioPlayer
          track={track}
          versionId={primaryVersion.id}
        />

        {/* Stems Panel */}
        <div className="mt-8">
          <StemsPanel versionId={primaryVersion.id} trackOwnerId={track.owner_user_id} />
        </div>

        {/* Version Selector (if multiple versions exist) */}
        {track.versions.length > 1 && (
          <div className="mt-8 p-6 bg-surface rounded-lg border border-border">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">
              Available Versions
            </h2>
            <div className="grid gap-3">
              {track.versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-md border transition-colors ${
                    version.id === primaryVersion.id
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-border bg-surfaceAlt hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {version.version_label}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Status: {version.status}
                      </div>
                    </div>
                    {version.id === primaryVersion.id && (
                      <span className="text-xs font-medium text-accent-600 uppercase">
                        Playing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liner Notes Section */}
        <PlayerClient
          track={track}
          primaryVersion={primaryVersion}
          isOwner={false}
        />
      </Container>
    </main>
  );
}
