/**
 * FFmpeg utility service
 * Handles media metadata extraction and transcoding
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Check if audio file is lossless format
 * Returns true for WAV, FLAC, ALAC codecs
 */
export async function isLosslessFormat(inputPath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_streams',
      '-select_streams',
      'a:0',
      inputPath,
    ]);

    const probe = JSON.parse(stdout);
    const audioStream = probe.streams?.[0];

    if (!audioStream) {
      return false;
    }

    const losslessCodecs = ['pcm_s16le', 'pcm_s24le', 'pcm_s32le', 'flac', 'alac', 'wav'];
    return losslessCodecs.includes(audioStream.codec_name?.toLowerCase() || '');
  } catch (error) {
    console.error('Failed to detect lossless format:', error);
    return false;
  }
}

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

/**
 * Transcode audio to HLS fMP4/CMAF with ALAC codec (lossless)
 * Creates 10-second segments for lossless quality
 * Only use with lossless source files (WAV, FLAC, ALAC)
 */
export async function transcodeToHLSLossless(
  inputPath: string,
  outputDir: string,
  playlistPath: string
): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-c:a',
    'alac',
    '-vn', // No video
    '-f',
    'hls',
    '-hls_time',
    '10', // 10-second segments for lossless
    '-hls_list_size',
    '0',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_type',
    'fmp4',
    '-hls_fmp4_init_filename',
    'init.mp4',
    '-hls_segment_filename',
    path.join(outputDir, 'segment_%03d.m4s'),
    playlistPath,
  ]);
}

/**
 * Extract embedded artwork from audio file
 * Returns null if no artwork is found
 */
export async function extractArtwork(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', [
      '-i',
      inputPath,
      '-an', // No audio
      '-vcodec',
      'copy',
      '-y', // Overwrite output
      outputPath,
    ]);
    return true;
  } catch (error: any) {
    // No artwork found is not an error - some files don't have embedded art
    if (error.stderr && error.stderr.includes('Output file is empty')) {
      return false;
    }
    throw error;
  }
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-vf',
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-q:v',
    '2', // High quality JPEG
    '-y',
    outputPath,
  ]);
}

/**
 * Analyze loudness using EBU R128 standard
 */
export async function analyzeLoudness(inputPath: string): Promise<{
  integrated_lufs: number;
  true_peak_dbfs: number;
  lra_lu: number;
}> {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-af',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ]);

  // Parse FFmpeg stderr output for loudness values
  const integratedMatch = stderr.match(/I:\s*(-?\d+\.?\d*)\s*LUFS/);
  const truePeakMatch = stderr.match(/True Peak:\s*(-?\d+\.?\d*)\s*dBFS/);
  const lraMatch = stderr.match(/LRA:\s*(-?\d+\.?\d*)\s*LU/);

  if (!integratedMatch) {
    throw new Error('Failed to extract integrated loudness from FFmpeg output');
  }

  return {
    integrated_lufs: parseFloat(integratedMatch[1]),
    true_peak_dbfs: truePeakMatch ? parseFloat(truePeakMatch[1]) : 0,
    lra_lu: lraMatch ? parseFloat(lraMatch[1]) : 0,
  };
}

/**
 * Transcode audio to 320kbps MP3 for lossy downloads
 */
export async function transcodeToMp3(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i',
    inputPath,
    '-c:a',
    'libmp3lame',
    '-b:a',
    '320k',
    '-q:a',
    '0',
    '-y',
    outputPath,
  ]);
}
