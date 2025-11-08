'use client';

import { useState } from 'react';

interface DownloadButtonProps {
  trackId: string;
  policy: 'disabled' | 'lossy' | 'original' | 'stems_included';
  price?: number | null;
}

/**
 * Download Button Component
 * Handles track downloads with copyright attestation
 */
export function DownloadButton({ trackId, policy, price }: DownloadButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (policy === 'disabled') {
    return null;
  }

  const formatText = policy === 'lossy' ? '320kbps MP3' : 'Original Quality';
  const priceText = price && price > 0 ? `$${(price / 100).toFixed(2)}` : 'Free';

  const handleDownload = async () => {
    if (!accepted) {
      alert('You must accept the terms to download');
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch(`/api/v1/tracks/${trackId}/downloads/generate`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Download failed');
      }

      const data = await res.json();

      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `track-${trackId}.${data.format === '320kbps' ? 'mp3' : 'wav'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowModal(false);
      alert('Download started!');
    } catch (error: any) {
      alert(error.message || 'Failed to generate download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-md transition flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download ({formatText}) {priceText !== 'Free' && `- ${priceText}`}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-800 border border-accent-500/30 rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-accent-400">Download Terms</h2>

            <div className="space-y-3 text-sm text-gray-300 max-h-96 overflow-y-auto p-4 bg-background-900 rounded">
              <h3 className="font-bold text-accent-300">Terms of Service</h3>
              <p>
                By downloading this track, you agree to use it only for personal, non-commercial purposes
                unless you have explicit permission from the rights holder.
              </p>

              <h3 className="font-bold text-accent-300 mt-4">Copyright Statement</h3>
              <p>
                This track is protected by copyright law. The artist has attested that they own all rights
                to this work. Unauthorized distribution, public performance, or commercial use is prohibited.
              </p>

              <h3 className="font-bold text-accent-300 mt-4">Your Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Do not redistribute this file without permission</li>
                <li>Do not use in commercial projects without a license</li>
                <li>Respect the artist's intellectual property rights</li>
                <li>Attribution is appreciated but not required for personal use</li>
              </ul>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm text-gray-300">
                I have read and accept the terms. I will respect copyright law and the artist's rights.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={!accepted || downloading}
                className="flex-1 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
              >
                {downloading ? 'Generating...' : `Download ${formatText}`}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-background-700 hover:bg-background-600 text-white rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
