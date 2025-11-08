'use client';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
}

/**
 * Audio Playback Controls Component
 *
 * Separated from AudioPlayer to keep components under 200 lines.
 * Displays play/pause, volume, speed controls and time display.
 */
export function AudioControls({
  isPlaying,
  isLoading,
  volume,
  playbackSpeed,
  currentTime,
  duration,
  onPlayPause,
  onVolumeChange,
  onSpeedChange,
}: AudioControlsProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Time Display */}
      <div className="flex justify-between items-center mb-4 text-sm text-neutral-600">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 mb-6">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-accent-500 hover:bg-accent-600 disabled:bg-neutral-300 text-white flex items-center justify-center transition-colors shadow-md"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4l10 6-10 6V4z" />
            </svg>
          )}
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1">
          <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5v13l-4-4H2v-5h4l4-4zm5 1.5a5 5 0 010 10v-2a3 3 0 000-6V5z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
            aria-label="Volume"
          />
          <span className="text-sm text-neutral-500 w-12 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="px-2 py-1 text-sm border border-border rounded-md bg-surface hover:border-neutral-400 transition-colors"
            aria-label="Playback speed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="text-xs text-neutral-500 pt-4 border-t border-border">
        <p>Keyboard shortcuts: Space (play/pause), ← → (seek ±5s)</p>
      </div>
    </>
  );
}
