'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { fetchStreamUrl, fetchWaveform, Track } from '@/lib/api';
import { theme as defaultTheme } from '@/config';

interface EmbedPlayerProps {
  track: Track;
  versionId: string;
  theme: 'light' | 'dark';
  autoplay: boolean;
  accentColor?: string;
}

/**
 * Minimal Embed Audio Player
 *
 * Stripped-down player for embedding on external sites.
 */
export function EmbedPlayer({ track, versionId, theme, autoplay, accentColor }: EmbedPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const colors = {
    surface: isDark ? '#292524' : '#ffffff',
    text: isDark ? '#f5f5f4' : '#292524',
    textSec: isDark ? '#a8a29e' : '#78716c',
    border: isDark ? '#44403c' : '#e7e5e4',
    wave: isDark ? '#57534e' : '#d6d3d1',
    waveBg: isDark ? '#0c0a09' : '#f5f5f4',
    progress: accentColor || defaultTheme.colors.accent[500],
  };

  useEffect(() => {
    if (!waveformRef.current) return;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [streamUrl, waveformData] = await Promise.all([
          fetchStreamUrl(versionId),
          fetchWaveform(versionId).catch(() => null),
        ]);

        const ws = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: colors.wave,
          progressColor: colors.progress,
          cursorColor: colors.progress,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 80,
          normalize: true,
          backend: 'WebAudio',
        });

        wavesurferRef.current = ws;
        await ws.load(streamUrl);

        if (waveformData?.data) {
          const peaks = waveformData.data.map((v: number) => (v / 128) - 1);
          ws.load(streamUrl, [peaks]);
        }

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('timeupdate', setCurrentTime);
        ws.on('ready', () => {
          setDuration(ws.getDuration());
          setIsLoading(false);
          if (autoplay) ws.play();
        });
        ws.on('error', () => {
          setError('Failed to load audio');
          setIsLoading(false);
        });
      } catch {
        setError('Failed to load player');
        setIsLoading(false);
      }
    };

    init();
    return () => wavesurferRef.current?.destroy();
  }, [versionId, autoplay]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '166px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '166px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '16px', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
        {track.artwork_url && (
          <img src={track.artwork_url} alt={track.title} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: '600', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
      </div>

      <div style={{ marginBottom: '8px', flexGrow: 1 }}>
        <div ref={waveformRef} style={{ width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden', backgroundColor: colors.waveBg }} />
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textSec, fontSize: '12px' }}>
            Loading...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => wavesurferRef.current?.playPause()}
          disabled={isLoading}
          style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: colors.progress, border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.5 : 1, flexShrink: 0 }}
        >
          {isPlaying ? (
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" /></svg>
          ) : (
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l10 6-10 6V4z" /></svg>
          )}
        </button>
        <div style={{ fontSize: '12px', color: colors.textSec, fontFamily: 'JetBrains Mono, Consolas, monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
