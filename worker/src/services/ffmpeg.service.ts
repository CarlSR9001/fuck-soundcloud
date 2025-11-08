/**
 * FFmpeg utility service
 * Handles media metadata extraction and transcoding
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Extract metadata using ffprobe
 */
export async function extractMetadata(inputPath: string): Promise<{
  duration_ms: number;
  sample_rate: number;
  channels: number;
}> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    '-select_streams',
    'a:0',
    inputPath,
  ]);

  const probe = JSON.parse(stdout);
  const audioStream = probe.streams?.[0];
  const format = probe.format;

  if (!audioStream || !format) {
    throw new Error('Failed to extract audio metadata');
  }

  return {
    duration_ms: Math.floor(parseFloat(format.duration) * 1000),
    sample_rate: parseInt(audioStream.sample_rate, 10),
    channels: audioStream.channels,
  };
}

/**
 * Transcode audio to HLS fMP4/CMAF with Opus codec
 * Creates 6-second segments with 2-second parts at 160kbps
 */
export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  playlistPath: string
): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-c:a',
    'libopus',
    '-b:a',
    '160k',
    '-vn', // No video
    '-f',
    'hls',
    '-hls_time',
    '6', // 6-second segments
    '-hls_list_size',
    '0', // Include all segments in playlist
    '-hls_segment_type',
    'fmp4', // fMP4/CMAF format
    '-hls_fmp4_init_filename',
    'init.mp4',
    '-hls_segment_filename',
    path.join(outputDir, 'segment_%03d.m4s'),
    '-movflags',
    '+faststart+frag_keyframe',
    '-frag_duration',
    '2000000', // 2-second parts (in microseconds)
    playlistPath,
  ]);
}
