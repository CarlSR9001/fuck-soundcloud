'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { fetchStreamUrl, fetchWaveform, Track } from '@/lib/api';
import { theme } from '@/config';
import { AudioControls } from './AudioControls';

interface AudioPlayerProps {
  track: Track;
  versionId: string;
}

/**
 * Audio Player with version-aware playback position preservation.
 * Automatically restores position when switching versions.
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

  const lastPositionRef = useRef<number>(0);
  const shouldResumeRef = useRef<boolean>(false);

  useEffect(() => {
    if (!waveformRef.current) return;

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (wavesurferRef.current) {
          lastPositionRef.current = wavesurferRef.current.getCurrentTime();
          shouldResumeRef.current = wavesurferRef.current.isPlaying();
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }

        // Fetch data
        const [streamUrl, waveformData] = await Promise.all([
          fetchStreamUrl(versionId),
          fetchWaveform(versionId).catch(() => null), // Waveform is optional
        ]);

        // Create instance
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

        // Load audio
        await wavesurfer.load(streamUrl);

        if (waveformData && waveformData.data) {
          const peaks = waveformData.data.map((v: number) => (v / 128) - 1);
          wavesurfer.load(streamUrl, [peaks]);
        }
        wavesurfer.setVolume(volume);
        wavesurfer.setPlaybackRate(playbackSpeed);

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('timeupdate', (time) => setCurrentTime(time));
        wavesurfer.on('ready', () => {
          setDuration(wavesurfer.getDuration());
          setIsLoading(false);

          if (lastPositionRef.current > 0) {
            const newDuration = wavesurfer.getDuration();
            const seekPosition = Math.min(lastPositionRef.current, newDuration);
            wavesurfer.seekTo(seekPosition / newDuration);
            if (shouldResumeRef.current) wavesurfer.play();
            lastPositionRef.current = 0;
            shouldResumeRef.current = false;
          }
        });
        wavesurfer.on('error', (err) => {
          console.error('Wavesurfer error:', err);
          setError('Failed to load audio. Please try again.');
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Failed to initialize player:', err);
        setError('Failed to initialize player. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [versionId, volume, playbackSpeed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!wavesurferRef.current || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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

  if (error) {
    return (
      <div className="p-8 bg-surface rounded-lg border border-error text-center">
        <p className="text-error font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border shadow-md p-6">
      <div className="mb-6">
        <div ref={waveformRef} className="w-full rounded-md overflow-hidden bg-surfaceAlt" style={{ minHeight: '128px' }} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surfaceAlt/50">
            <div className="text-neutral-500">Loading waveform...</div>
          </div>
        )}
      </div>

      <AudioControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        volume={volume}
        playbackSpeed={playbackSpeed}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}
