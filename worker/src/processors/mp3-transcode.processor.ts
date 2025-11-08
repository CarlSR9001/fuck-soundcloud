/**
 * MP3 Transcode job processor
 * Handles transcoding to 320kbps MP3 for lossy downloads
 */

import { Job } from 'bullmq';
import { Mp3TranscodeJobData, Mp3TranscodeJobResult } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import { StorageService } from '../services/storage.service';
import { transcodeToMp3 } from '../services/ffmpeg.service';
import { TrackVersion, Asset } from '../../../api/src/entities';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Process MP3 transcode job
 */
export async function processMp3TranscodeJob(
  job: Job<Mp3TranscodeJobData>
): Promise<Mp3TranscodeJobResult> {
  const { version_id, track_id } = job.data;
  const storage = new StorageService();
  const workDir = `/tmp/mp3-transcode-${job.id}`;

  console.log(`[MP3Transcode] Processing job ${job.id} for version ${version_id}`);

  try {
    await fs.promises.mkdir(workDir, { recursive: true });
    await job.updateProgress(5);

    // Fetch entities from database
    const dataSource = getDataSource();
    const trackVersionRepo = dataSource.getRepository(TrackVersion);
    const assetRepo = dataSource.getRepository(Asset);

    const trackVersion = await trackVersionRepo.findOne({
      where: { id: version_id },
    });

    if (!trackVersion) {
      throw new Error(`TrackVersion ${version_id} not found`);
    }

    const originalAsset = await assetRepo.findOne({
      where: { id: trackVersion.original_asset_id },
    });

    if (!originalAsset) {
      throw new Error(`Original asset ${trackVersion.original_asset_id} not found`);
    }

    await job.updateProgress(10);

    // Download original audio file
    const inputPath = path.join(workDir, 'input' + path.extname(originalAsset.key));
    console.log(`[MP3Transcode] Downloading ${originalAsset.bucket}/${originalAsset.key}`);
    await storage.downloadFile(originalAsset.bucket, originalAsset.key, inputPath);
    await job.updateProgress(30);

    // Transcode to 320kbps MP3
    console.log(`[MP3Transcode] Transcoding to 320kbps MP3`);
    const outputPath = path.join(workDir, '320.mp3');
    await transcodeToMp3(inputPath, outputPath);
    await job.updateProgress(80);

    // Upload MP3 to MinIO
    console.log(`[MP3Transcode] Uploading MP3 to MinIO`);
    const bucket = storage.getBucket('transcodes');
    const key = `downloads/${track_id}/320.mp3`;

    const mp3Buffer = await fs.promises.readFile(outputPath);
    await storage.uploadFile(bucket, key, mp3Buffer, 'audio/mpeg');
    await job.updateProgress(95);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true });

    console.log(`[MP3Transcode] Job ${job.id} completed successfully`);
    return {
      success: true,
      bucket,
      key,
    };
  } catch (error) {
    console.error(`[MP3Transcode] Job ${job.id} failed:`, error);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      bucket: '',
      key: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
