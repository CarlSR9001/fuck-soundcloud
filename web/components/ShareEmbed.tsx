'use client';

import { useState } from 'react';

interface ShareEmbedProps {
  trackId: string;
  onClose: () => void;
}

/**
 * Share/Embed Modal Component
 *
 * Generates iframe embed code with customization options:
 * - Theme (light/dark)
 * - Autoplay (on/off)
 * - Custom accent color
 */
export function ShareEmbed({ trackId, onClose }: ShareEmbedProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [autoplay, setAutoplay] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate embed URL with query params
  const generateEmbedUrl = () => {
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/embed/track/${trackId}`
      : `/embed/track/${trackId}`;

    const params = new URLSearchParams();
    if (theme !== 'light') params.set('theme', theme);
    if (autoplay) params.set('autoplay', '1');
    if (customColor) params.set('color', customColor.replace('#', ''));

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Generate iframe code
  const generateIframeCode = () => {
    const embedUrl = generateEmbedUrl();
    return `<iframe src="${embedUrl}" width="100%" height="166" frameborder="0" allowfullscreen></iframe>`;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateIframeCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-neutral-900">Share & Embed</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Embed Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-700">Customize</h3>
            <div className="flex gap-2">
              <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-accent-500 text-white' : 'bg-surfaceAlt text-neutral-700 hover:bg-neutral-200'}`}>Light</button>
              <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-accent-500 text-white' : 'bg-surfaceAlt text-neutral-700 hover:bg-neutral-200'}`}>Dark</button>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="autoplay" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} className="w-4 h-4 rounded border-border text-accent-500" />
              <label htmlFor="autoplay" className="text-sm text-neutral-700 cursor-pointer">Enable autoplay</label>
            </div>
            <div className="flex gap-2 items-center">
              <input type="color" value={customColor || '#349e6a'} onChange={(e) => setCustomColor(e.target.value)} className="w-12 h-10 rounded border border-border cursor-pointer" />
              <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Accent color" className="flex-1 px-3 py-2 border border-border rounded-md text-sm" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Preview</h3>
            <div className="border border-border rounded-lg overflow-hidden bg-neutral-50">
              <iframe
                src={generateEmbedUrl()}
                width="100%"
                height="166"
                frameBorder="0"
                title="Embed preview"
              />
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Embed Code</h3>
            <div className="relative">
              <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg text-xs overflow-x-auto">
                <code>{generateIframeCode()}</code>
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs rounded-md transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Direct Link */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Direct Link</h3>
            <div className="flex gap-2">
              <input type="text" value={generateEmbedUrl()} readOnly className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-surfaceAlt" />
              <button onClick={() => navigator.clipboard.writeText(generateEmbedUrl())} className="px-4 py-2 bg-surfaceAlt hover:bg-neutral-200 text-neutral-700 text-sm rounded-md">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
