'use client';

import { useState } from 'react';

interface QualityToggleProps {
  currentFormat: 'hls_opus' | 'hls_alac';
  losslessAvailable: boolean;
  onQualityChange: (format: 'hls_opus' | 'hls_alac') => void;
  estimatedSize?: {
    opus: string;
    alac: string;
  };
}

/**
 * Quality Toggle Component
 *
 * Allows users to switch between standard (Opus) and lossless (ALAC) streaming
 * Shows file size estimates and bandwidth warnings
 */
export function QualityToggle({
  currentFormat,
  losslessAvailable,
  onQualityChange,
  estimatedSize,
}: QualityToggleProps) {
  const [showInfo, setShowInfo] = useState(false);

  const isLossless = currentFormat === 'hls_alac';

  if (!losslessAvailable) {
    return null;
  }

  return (
    <div className="bg-surfaceAlt rounded-md border border-border p-3">
      {/* Quality Selector */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700">
          Streaming Quality
        </span>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs text-neutral-500 hover:text-neutral-700"
          aria-label="Toggle quality info"
        >
          {showInfo ? 'Hide' : 'Info'}
        </button>
      </div>

      {/* Toggle Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => onQualityChange('hls_opus')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            !isLossless
              ? 'bg-accent-500 text-white'
              : 'bg-surface border border-border text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Standard (Opus)
        </button>
        <button
          onClick={() => onQualityChange('hls_alac')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isLossless
              ? 'bg-accent-500 text-white'
              : 'bg-surface border border-border text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Lossless (ALAC)
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-neutral-600 space-y-2">
          <div className="flex justify-between">
            <span>Standard Quality:</span>
            <span className="font-mono">{estimatedSize?.opus || '~2-3 MB/min'}</span>
          </div>
          <div className="flex justify-between">
            <span>Lossless Quality:</span>
            <span className="font-mono">{estimatedSize?.alac || '~4-6 MB/min'}</span>
          </div>
          {isLossless && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              ⚠️ Lossless streaming uses 2-3x more bandwidth
            </div>
          )}
        </div>
      )}
    </div>
  );
}
