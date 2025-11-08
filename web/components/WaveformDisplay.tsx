'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { fetchStreamUrl, fetchWaveform } from '@/lib/api';
import { theme } from '@/config';

interface WaveformDisplayProps {
  versionId: string;
  volume: number;
  playbackSpeed: number;
  onReady: (wavesurfer: WaveSurfer) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  lastPosition: number;
  shouldResume: boolean;
}

/**
 * Waveform Display Component
 *
 * Handles Wavesurfer.js initialization and waveform rendering.
 * Extracted from AudioPlayer to maintain 200-line limit.
 */
export function WaveformDisplay({
  versionId,
  volume,
  playbackSpeed,
  onReady,
  onError,
  onLoadingChange,
  lastPosition,
  shouldResume,
}: WaveformDisplayProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    const initializeWaveform = async () => {
      try {
        onLoadingChange(true);

        // Destroy existing instance
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }

        // Fetch stream URL and waveform data
        const [streamUrl, waveformData] = await Promise.all([
          fetchStreamUrl(versionId),
          fetchWaveform(versionId).catch(() => null),
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

        // Load audio
        await wavesurfer.load(streamUrl);

        // Load waveform peaks if available
        if (waveformData && waveformData.data) {
          const peaks = waveformData.data.map((v: number) => (v / 128) - 1);
          wavesurfer.load(streamUrl, [peaks]);
        }

        // Set volume and playback speed
        wavesurfer.setVolume(volume);
        wavesurfer.setPlaybackRate(playbackSpeed);

        // Ready event
        wavesurfer.on('ready', () => {
          onLoadingChange(false);

          // Restore playback position
          if (lastPosition > 0) {
            const newDuration = wavesurfer.getDuration();
            const seekPosition = Math.min(lastPosition, newDuration);
            wavesurfer.seekTo(seekPosition / newDuration);

            if (shouldResume) {
              wavesurfer.play();
            }
          }

          onReady(wavesurfer);
        });

        // Error event
        wavesurfer.on('error', (err) => {
          console.error('Wavesurfer error:', err);
          onError('Failed to load audio. Please try again.');
          onLoadingChange(false);
        });

      } catch (err) {
        console.error('Failed to initialize waveform:', err);
        onError('Failed to initialize player. Please refresh the page.');
        onLoadingChange(false);
      }
    };

    initializeWaveform();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [versionId, volume, playbackSpeed, lastPosition, shouldResume, onReady, onError, onLoadingChange]);

  return (
    <div
      ref={waveformRef}
      className="w-full rounded-md overflow-hidden bg-surfaceAlt"
      style={{ minHeight: '128px' }}
    />
  );
}
