'use client';

import { useState } from 'react';
import { createTrackVersion } from '@/lib/api';
import { NewVersionForm } from './NewVersionForm';

interface NewVersionButtonProps {
  trackId: string;
  currentVersionCount: number;
  onVersionCreated?: () => void;
  disabled?: boolean;
}

/**
 * New Version Button Component
 * Opens modal to upload a new version of a track.
 */
export function NewVersionButton({
  trackId,
  currentVersionCount,
  onVersionCreated,
  disabled = false,
}: NewVersionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState(`v${currentVersionCount + 1}`);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    if (newFile) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !versionLabel.trim()) {
      setError('Please select a file and enter a version label.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      await createTrackVersion(trackId, file, versionLabel, setUploadProgress);
      setIsUploading(false);
      setIsOpen(false);
      setFile(null);
      setVersionLabel(`v${currentVersionCount + 2}`);
      if (onVersionCreated) onVersionCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        aria-label="Upload new version"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Version
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50">
          <div className="bg-surface rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Upload New Version</h2>
                  <p className="text-sm text-neutral-500 mt-1">Add a new version of this track</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isUploading}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <NewVersionForm
              versionLabel={versionLabel}
              onVersionLabelChange={setVersionLabel}
              file={file}
              onFileChange={handleFileChange}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={error}
              onSubmit={handleSubmit}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
