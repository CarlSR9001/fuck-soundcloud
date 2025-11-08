'use client';

import { useState } from 'react';

interface PreviewLink {
  id: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

interface ScheduleFormProps {
  trackId: string;
  currentPublishedAt?: string | null;
  currentEmbargoUntil?: string | null;
  isScheduled?: boolean;
}

/**
 * Schedule Form Component
 *
 * Allows artists to schedule track releases, set embargos, and create preview links.
 * Year 3035 aesthetic with neon accents and cyberpunk vibes.
 */
export function ScheduleForm({
  trackId,
  currentPublishedAt,
  currentEmbargoUntil,
  isScheduled,
}: ScheduleFormProps) {
  const [publishedAt, setPublishedAt] = useState(currentPublishedAt || '');
  const [embargoUntil, setEmbargoUntil] = useState(currentEmbargoUntil || '');
  const [isImmediate, setIsImmediate] = useState(!isScheduled);
  const [previewLinks, setPreviewLinks] = useState<PreviewLink[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSchedule = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/v1/tracks/${trackId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published_at: isImmediate ? null : publishedAt || null,
          embargo_until: embargoUntil || null,
        }),
      });
      if (res.ok) {
        setMessage('Schedule updated successfully!');
      } else {
        setMessage('Failed to update schedule');
      }
    } catch (err) {
      setMessage('Error updating schedule');
    }
    setLoading(false);
  };

  const handleCreatePreviewLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tracks/${trackId}/preview-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expires_at: expiresAt || null,
          max_uses: maxUses ? parseInt(maxUses) : null,
        }),
      });
      if (res.ok) {
        const link = await res.json();
        setPreviewLinks([link, ...previewLinks]);
        setExpiresAt('');
        setMaxUses('');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/api/v1/preview/${token}`;
    navigator.clipboard.writeText(url);
    setMessage('Preview link copied!');
  };

  const handleRevoke = async (linkId: string) => {
    await fetch(`/api/v1/preview-links/${linkId}`, { method: 'DELETE' });
    setPreviewLinks(previewLinks.filter((l) => l.id !== linkId));
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg border border-accent-500/30 shadow-lg">
      <h2 className="text-2xl font-bold text-accent-400">Release Schedule</h2>

      {/* Schedule Toggle */}
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isImmediate}
            onChange={(e) => setIsImmediate(e.target.checked)}
            className="w-5 h-5 accent-accent-500"
          />
          <span className="text-gray-300">Release immediately</span>
        </label>

        {!isImmediate && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-gray-400 text-sm">Publish Date (UTC)</span>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
              />
            </label>

            <label className="block">
              <span className="text-gray-400 text-sm">Embargo Until (Optional)</span>
              <input
                type="datetime-local"
                value={embargoUntil}
                onChange={(e) => setEmbargoUntil(e.target.value)}
                className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
              />
            </label>
          </div>
        )}

        <button
          onClick={handleSchedule}
          disabled={loading}
          className="px-6 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-700 text-white rounded-md transition-colors"
        >
          {loading ? 'Saving...' : 'Update Schedule'}
        </button>
      </div>

      {/* Preview Links */}
      <div className="space-y-4 pt-6 border-t border-gray-700">
        <h3 className="text-xl font-semibold text-accent-400">Preview Links</h3>

        <div className="space-y-3">
          <label className="block">
            <span className="text-gray-400 text-sm">Expires At (Optional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-accent-500"
            />
          </label>

          <label className="block">
            <span className="text-gray-400 text-sm">Max Uses (Optional)</span>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-accent-500"
            />
          </label>

          <button
            onClick={handleCreatePreviewLink}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-md"
          >
            Generate Preview Link
          </button>
        </div>

        {/* Active Preview Links */}
        {previewLinks.length > 0 && (
          <div className="space-y-2 mt-4">
            {previewLinks.map((link) => (
              <div key={link.id} className="p-3 bg-gray-800 rounded-md border border-gray-700">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 overflow-hidden">
                    <code className="text-xs text-accent-300 break-all">{link.token}</code>
                    <div className="text-xs text-gray-500 mt-1">
                      Uses: {link.use_count}/{link.max_uses || '∞'} •{' '}
                      {link.expires_at ? `Expires ${new Date(link.expires_at).toLocaleString()}` : 'No expiry'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(link.token)}
                      className="px-3 py-1 text-xs bg-accent-600 hover:bg-accent-700 text-white rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && <div className="text-sm text-accent-400">{message}</div>}
    </div>
  );
}
