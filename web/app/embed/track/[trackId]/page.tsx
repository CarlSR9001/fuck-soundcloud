import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchTrack, ApiError } from '@/lib/api';
import { EmbedPlayer } from '@/components/EmbedPlayer';
import { branding } from '@/config';

interface EmbedPageProps {
  params: {
    trackId: string;
  };
  searchParams: {
    theme?: 'light' | 'dark';
    autoplay?: '0' | '1';
    color?: string;
  };
}

/**
 * Generate metadata for embed page
 */
export async function generateMetadata({
  params,
}: EmbedPageProps): Promise<Metadata> {
  try {
    const track = await fetchTrack(params.trackId);
    return {
      title: `${track.title} - ${branding.name}`,
      robots: 'noindex', // Don't index embed pages
    };
  } catch (error) {
    return {
      title: `Track Not Found - ${branding.name}`,
    };
  }
}

/**
 * Embed Track Player Page (Server Component)
 *
 * Minimal player for embedding on external sites.
 * Supports theme, autoplay, and color customization via query params.
 */
export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  let track;

  try {
    track = await fetchTrack(params.trackId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Get the primary version
  const primaryVersion = track.versions.find(
    (v) => v.id === track.primary_version_id
  ) || track.versions[0];

  if (!primaryVersion) {
    return (
      <div className="flex items-center justify-center h-full p-4 bg-neutral-50">
        <p className="text-sm text-neutral-600">Track processing...</p>
      </div>
    );
  }

  // Check if track has a ready HLS transcode
  const hlsTranscode = primaryVersion.transcodes.find(
    (t) => t.format === 'hls_opus' && t.status === 'ready'
  );

  if (!hlsTranscode) {
    return (
      <div className="flex items-center justify-center h-full p-4 bg-neutral-50">
        <p className="text-sm text-neutral-600">Track still transcoding...</p>
      </div>
    );
  }

  // Parse query parameters
  const theme = searchParams.theme || 'light';
  const autoplay = searchParams.autoplay === '1';
  const accentColor = searchParams.color || undefined;

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="m-0 p-0 overflow-hidden">
        <EmbedPlayer
          track={track}
          versionId={primaryVersion.id}
          theme={theme}
          autoplay={autoplay}
          accentColor={accentColor}
        />
      </body>
    </html>
  );
}
