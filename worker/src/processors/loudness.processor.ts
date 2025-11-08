/**
 * Loudness analysis processor
 * Performs EBU R128 loudness measurement
 */

import { Job } from 'bullmq';
import { LoudnessJobData, LoudnessJobResult } from '@soundcloud-clone/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import { analyzeLoudness } from '../services/ffmpeg.service';
import { StorageService } from '../services/storage.service';
import { getDataSource } from '../config/typeorm.config';
import { Asset } from '../../../api/src/entities/asset.entity';
import { TrackVersion } from '../../../api/src/entities/track-version.entity';

const storage = new StorageService();

/**
 * Process loudness analysis job
 */
export async function processLoudnessJob(
  job: Job<LoudnessJobData>
): Promise<LoudnessJobResult> {
  const { version_id, original_asset_id } = job.data;
  const tempDir = `/tmp/loudness-${job.id}`;

  console.log(
    `[Loudness] Processing job ${job.id} for version ${version_id}, asset ${original_asset_id}`
  );

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await job.updateProgress(10);

    // Get the original asset to download
    const dataSource = getDataSource();
    const assetRepo = dataSource.getRepository(Asset);
    const originalAsset = await assetRepo.findOne({
      where: { id: original_asset_id },
    });

    if (!originalAsset) {
      throw new Error(`Original asset ${original_asset_id} not found`);
    }

    // Download original file
    const originalPath = path.join(tempDir, 'original');
    await storage.downloadFile(
      originalAsset.bucket,
      originalAsset.key,
      originalPath
    );
    await job.updateProgress(30);

    // Analyze loudness with FFmpeg ebur128 filter
    const loudnessData = await analyzeLoudness(originalPath);
    await job.updateProgress(80);

    // Update TrackVersion with loudness data
    const versionRepo = dataSource.getRepository(TrackVersion);
    const version = await versionRepo.findOne({
      where: { id: version_id },
    });

    if (!version) {
      throw new Error(`TrackVersion ${version_id} not found`);
    }

    version.loudness_lufs = loudnessData.integrated_lufs;
    await versionRepo.save(version);

    await job.updateProgress(100);

    console.log(
      `[Loudness] Successfully analyzed loudness for job ${job.id}: ${loudnessData.integrated_lufs} LUFS`
    );

    return {
      success: true,
      integrated_lufs: loudnessData.integrated_lufs,
      true_peak_dbfs: loudnessData.true_peak_dbfs,
      lra_lu: loudnessData.lra_lu,
    };
  } catch (error: any) {
    console.error(`[Loudness] Error in job ${job.id}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error during loudness analysis',
    };
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[Loudness] Failed to cleanup temp dir ${tempDir}:`, err);
    }
  }
}
