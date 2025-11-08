'use client';

import { useState, useEffect } from 'react';

interface Download {
  id: string;
  user_handle: string;
  format: string;
  ip_hash: string;
  created_at: string;
}

interface DownloadHistoryTableProps {
  trackId: string;
}

/**
 * Download History Table Component
 * Shows download history for track owners
 */
export function DownloadHistoryTable({ trackId }: DownloadHistoryTableProps) {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/tracks/${trackId}/downloads/history`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to fetch history');

        const data = await res.json();
        setDownloads(data);
      } catch (error) {
        console.error('Failed to load download history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [trackId]);

  if (loading) {
    return (
      <div className="bg-background-800 border border-accent-500/30 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-background-700 rounded w-1/3"></div>
          <div className="h-4 bg-background-700 rounded"></div>
          <div className="h-4 bg-background-700 rounded"></div>
          <div className="h-4 bg-background-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-800 border border-accent-500/30 rounded-lg p-6">
      <h3 className="text-xl font-bold text-accent-400 mb-4">Download History</h3>

      {downloads.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No downloads yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent-500/30 text-left">
                <th className="pb-2 text-accent-300">User</th>
                <th className="pb-2 text-accent-300">Format</th>
                <th className="pb-2 text-accent-300">IP Hash</th>
                <th className="pb-2 text-accent-300">Downloaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-500/10">
              {downloads.map((download) => (
                <tr key={download.id} className="hover:bg-background-700/50">
                  <td className="py-3 text-gray-300">@{download.user_handle}</td>
                  <td className="py-3 text-gray-300">
                    <span className="px-2 py-1 bg-accent-500/20 text-accent-300 rounded text-xs">
                      {download.format}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 font-mono text-xs">
                    {download.ip_hash}...
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(download.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {downloads.length > 0 && (
        <div className="mt-4 text-xs text-gray-400">
          Showing last {downloads.length} downloads. IP addresses are hashed for privacy.
        </div>
      )}
    </div>
  );
}
