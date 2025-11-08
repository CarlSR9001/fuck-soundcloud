'use client';

import { useState } from 'react';
import { TrackVersion } from '@/lib/api';
import { theme } from '@/config';

interface VersionSwitcherProps {
  versions: TrackVersion[];
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
  disabled?: boolean;
}

/**
 * Version Switcher Component
 *
 * Allows users to switch between different versions of a track.
 * Features:
 * - Dropdown UI showing all versions
 * - Current version highlighted
 * - Version metadata (label, status, duration)
 * - Click to switch versions
 * - Year 3035 aesthetic
 */
export function VersionSwitcher({
  versions,
  currentVersionId,
  onVersionChange,
  disabled = false,
}: VersionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentVersion = versions.find((v) => v.id === currentVersionId);
  const readyVersions = versions.filter((v) => v.status === 'ready');

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleVersionSelect = (versionId: string) => {
    if (versionId !== currentVersionId) {
      onVersionChange(versionId);
    }
    setIsOpen(false);
  };

  if (readyVersions.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Switch version"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-neutral-900">
            {currentVersion?.version_label || 'Version'}
          </span>
          <span className="text-xs text-neutral-500">
            {readyVersions.length} versions
          </span>
        </div>
        <svg className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-3 border-b border-border bg-surfaceAlt">
              <h3 className="text-sm font-semibold text-neutral-900">Available Versions</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Select a version to play
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {readyVersions.map((version) => {
                const isCurrent = version.id === currentVersionId;

                return (
                  <button
                    key={version.id}
                    onClick={() => handleVersionSelect(version.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-surfaceAlt transition-colors border-l-4 ${
                      isCurrent
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-transparent'
                    }`}
                    aria-current={isCurrent}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isCurrent ? 'text-accent-700' : 'text-neutral-900'
                          }`}>
                            {version.version_label}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-medium text-accent-600 uppercase bg-accent-100 px-1.5 py-0.5 rounded">
                              Playing
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                          <span>{formatDuration(version.duration_ms)}</span>
                          {version.sample_rate && (
                            <span>{(version.sample_rate / 1000).toFixed(1)} kHz</span>
                          )}
                          <span>{formatDate(version.created_at)}</span>
                        </div>
                      </div>

                      {isCurrent && (
                        <svg className="w-5 h-5 text-accent-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-border bg-surfaceAlt text-xs text-neutral-500">
              Showing {readyVersions.length} ready version{readyVersions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
