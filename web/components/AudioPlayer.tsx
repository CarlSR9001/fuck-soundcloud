'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { fetchStreamUrl, fetchWaveform, Track } from '@/lib/api';
import { theme } from '@/config';

interface AudioPlayerProps {
  track: Track;
  versionId: string;
}

/**
 * Audio Player Component with Wavesurfer.js
 *
 * Features:
 * - HLS playback with Wavesurfer.js
 * - Waveform visualization from API JSON
 * - Playback controls (play/pause, seek, volume, speed)
 * - Current time and duration display
 * - Waveform scrubbing (click to seek)
 * - Keyboard shortcuts (space, arrows)
 * - Year 3035 aesthetic design
 */
export function AudioPlayer({ track, versionId }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Wavesurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch stream URL and waveform data
        const [streamUrl, waveformData] = await Promise.all([
          fetchStreamUrl(versionId),
          fetchWaveform(versionId).catch(() => null), // Waveform is optional
        ]);

        // Create Wavesurfer instance
        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: theme.colors.primary[300],
          progressColor: theme.colors.accent[500],
          cursorColor: theme.colors.accent[600],
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 128,
          normalize: true,
          backend: 'WebAudio',
        });

        wavesurferRef.current = wavesurfer;

        // Load audio (HLS or direct URL)
        await wavesurfer.load(streamUrl);

        // Load waveform peaks if available
        if (waveformData && waveformData.data) {
          // Convert waveform data to peaks format for Wavesurfer
          const peaks = waveformData.data.map((v: number) => (v / 128) - 1);
          wavesurfer.load(streamUrl, [peaks]);
        }

        // Set initial volume and playback speed
        wavesurfer.setVolume(volume);
        wavesurfer.setPlaybackRate(playbackSpeed);

        // Event listeners
        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('timeupdate', (time) => setCurrentTime(time));
        wavesurfer.on('ready', () => {
          setDuration(wavesurfer.getDuration());
          setIsLoading(false);
        });
        wavesurfer.on('error', (err) => {
          console.error('Wavesurfer error:', err);
          setError('Failed to load audio. Please try again.');
          setIsLoading(false);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize player:', err);
        setError('Failed to initialize player. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [versionId, volume, playbackSpeed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!wavesurferRef.current) return;

      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, duration]);

  // Playback controls
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const seek = (time: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(time / duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(newSpeed);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="p-8 bg-surface rounded-lg border border-error text-center">
        <p className="text-error font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border shadow-md p-6">
      {/* Waveform Container */}
      <div className="mb-6">
        <div
          ref={waveformRef}
          className="w-full rounded-md overflow-hidden bg-surfaceAlt"
          style={{ minHeight: '128px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surfaceAlt/50">
            <div className="text-neutral-500">Loading waveform...</div>
          </div>
        )}
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center mb-4 text-sm text-neutral-600">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 mb-6">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
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
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
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
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
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
    </div>
  );
}
