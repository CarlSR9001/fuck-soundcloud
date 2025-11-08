'use client';

import { useState, useRef } from 'react';

interface NewVersionFormProps {
  versionLabel: string;
  onVersionLabelChange: (label: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * New Version Upload Form
 * Extracted from NewVersionButton to maintain 200-line limit.
 */
export function NewVersionForm({
  versionLabel,
  onVersionLabelChange,
  file,
  onFileChange,
  isUploading,
  uploadProgress,
  error,
  onSubmit,
  onCancel,
}: NewVersionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|flac|aac|ogg)$/i)) {
      return;
    }
    if (selectedFile.size > 500 * 1024 * 1024) {
      return;
    }
    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      <div>
        <label htmlFor="versionLabel" className="block text-sm font-medium text-neutral-900 mb-2">
          Version Label
        </label>
        <input
          id="versionLabel"
          type="text"
          value={versionLabel}
          onChange={(e) => onVersionLabelChange(e.target.value)}
          placeholder="e.g., v2, Radio Edit, Remaster 2025"
          disabled={isUploading}
          maxLength={100}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:bg-neutral-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-2">Audio File</label>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-accent-500 bg-accent-50' : 'border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            disabled={isUploading}
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              <svg className="w-12 h-12 mx-auto text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-sm font-medium text-neutral-900">{file.name}</p>
              <p className="text-xs text-neutral-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                disabled={isUploading}
                className="text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-12 h-12 mx-auto text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-neutral-600">
                Drag and drop or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-accent-600 hover:text-accent-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-neutral-500">MP3, WAV, FLAC, AAC, or OGG (max 500MB)</p>
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Uploading...</span>
            <span className="text-neutral-900 font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-accent-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading || !file}
          className="px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isUploading ? 'Uploading...' : 'Upload Version'}
        </button>
      </div>
    </form>
  );
}
