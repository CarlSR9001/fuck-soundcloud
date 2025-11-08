'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface LinerNotesDisplayProps {
  linerNotes: string | null;
  sessionDate: string | null;
  sessionLocation: string | null;
  instruments: string[] | null;
  gear: string[] | null;
}

/**
 * LinerNotesDisplay Component
 *
 * Displays track liner notes with session metadata.
 * Year 3035 aesthetic: minimal, clean, futuristic.
 */
export function LinerNotesDisplay({
  linerNotes,
  sessionDate,
  sessionLocation,
  instruments,
  gear,
}: LinerNotesDisplayProps) {
  const hasSessionInfo = sessionDate || sessionLocation;
  const hasInstruments = instruments && instruments.length > 0;
  const hasGear = gear && gear.length > 0;
  const hasAnyContent = linerNotes || hasSessionInfo || hasInstruments || hasGear;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Session Info Card */}
      {hasSessionInfo && (
        <div className="p-6 bg-surface rounded-lg border border-border">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Session Info
          </h3>
          <div className="space-y-2 text-neutral-900">
            {sessionDate && (
              <div className="flex gap-3">
                <span className="text-neutral-500 w-20">Date:</span>
                <span className="font-medium">
                  {new Date(sessionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            {sessionLocation && (
              <div className="flex gap-3">
                <span className="text-neutral-500 w-20">Location:</span>
                <span className="font-medium">{sessionLocation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruments List */}
      {hasInstruments && (
        <div className="p-6 bg-surface rounded-lg border border-border">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Instruments
          </h3>
          <ul className="grid grid-cols-2 gap-2">
            {instruments.map((instrument, idx) => (
              <li key={idx} className="flex items-center gap-2 text-neutral-900">
                <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                <span>{instrument}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gear List */}
      {hasGear && (
        <div className="p-6 bg-surface rounded-lg border border-border">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Gear & Plugins
          </h3>
          <ul className="grid grid-cols-2 gap-2">
            {gear.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-neutral-900">
                <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liner Notes (Markdown) */}
      {linerNotes && (
        <div className="p-6 bg-surface rounded-lg border border-border">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Liner Notes
          </h3>
          <div className="prose prose-neutral max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-accent-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-900 prose-code:text-accent-600 prose-code:bg-accent-50 prose-code:px-1 prose-code:rounded prose-pre:bg-neutral-900 prose-pre:text-neutral-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {linerNotes}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
