/**
 * User Profile Page
 *
 * Displays user profile with avatar, bio, and track count.
 * Uses Next.js 15 App Router with server-side rendering.
 */

import { notFound } from 'next/navigation';
import { fetchUserProfile, ApiError } from '@/lib/api';
import { Container } from '@/components';
import Image from 'next/image';

interface ProfilePageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;

  let user;
  try {
    user = await fetchUserProfile(handle);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const trackCount = user.tracks?.length || 0;
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar_asset_id ? (
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={`/api/assets/${user.avatar_asset_id}`}
                    alt={`${user.display_name}'s avatar`}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {user.display_name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                @{user.handle}
              </p>

              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {trackCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    {trackCount === 1 ? 'track' : 'tracks'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Joined {joinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks Section */}
        {trackCount > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Tracks
            </h2>
            <div className="space-y-4">
              {user.tracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {track.title}
                  </h3>
                  {track.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                    <span>
                      {new Date(track.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <a
                      href={`/player/${track.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Play track →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {trackCount === 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No tracks yet
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { handle } = await params;

  try {
    const user = await fetchUserProfile(handle);
    return {
      title: `${user.display_name} (@${user.handle})`,
      description: user.bio || `View ${user.display_name}'s profile and tracks`,
    };
  } catch {
    return {
      title: 'User Not Found',
    };
  }
}
