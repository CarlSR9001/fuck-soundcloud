interface EmbargoedBadgeProps {
  embargoUntil: string | Date;
}

/**
 * Embargoed Badge Component
 *
 * Displays a badge on track cards when content is embargoed.
 * Shows the embargo date with year 3035 neon aesthetic.
 */
export function EmbargoedBadge({ embargoUntil }: EmbargoedBadgeProps) {
  const embargoDate = new Date(embargoUntil);
  const now = new Date();

  // Don't show badge if embargo has passed
  if (embargoDate <= now) {
    return null;
  }

  const formattedDate = embargoDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-500/50 rounded-full text-red-400 text-xs font-semibold shadow-lg">
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
      EMBARGOED UNTIL {formattedDate}
    </div>
  );
}
