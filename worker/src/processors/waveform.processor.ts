/**
 * Waveform job processor
 * Generates waveform JSON and PNG for track visualization
 */

import { Job } from 'bullmq';
import { WaveformJobData, WaveformJobResult } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import { StorageService } from '../services/storage.service';
import { TrackVersion, Asset, Waveform } from '../../../api/src/entities';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Process waveform generation job
 */
export async function processWaveformJob(
  job: Job<WaveformJobData>
): Promise<WaveformJobResult> {
  const { version_id } = job.data;
  const storage = new StorageService();
  const workDir = `/tmp/waveform-${job.id}`;

  console.log(`[Waveform] Processing job ${job.id} for version ${version_id}`);

  try {
    await fs.promises.mkdir(workDir, { recursive: true });
    await job.updateProgress(5);

    // Fetch entities from database
    const dataSource = getDataSource();
    const trackVersionRepo = dataSource.getRepository(TrackVersion);
    const assetRepo = dataSource.getRepository(Asset);
    const waveformRepo = dataSource.getRepository(Waveform);

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
    console.log(`[Waveform] Downloading ${originalAsset.bucket}/${originalAsset.key}`);
    await storage.downloadFile(originalAsset.bucket, originalAsset.key, inputPath);
    await job.updateProgress(20);

    // Generate waveform JSON (256 samples per second, 8-bit)
    const jsonPath = path.join(workDir, 'waveform.json');
    console.log(`[Waveform] Generating JSON waveform data`);
    await generateWaveformJSON(inputPath, jsonPath);
    await job.updateProgress(60);

    // Generate waveform PNG preview (optional)
    const pngPath = path.join(workDir, 'waveform.png');
    console.log(`[Waveform] Generating PNG waveform preview`);
    await generateWaveformPNG(inputPath, pngPath);
    await job.updateProgress(70);

    // Upload waveform files to MinIO
    const waveformsBucket = storage.getBucket('waveforms');
    const jsonKey = `tracks/${version_id}/waveform.json`;
    const pngKey = `tracks/${version_id}/waveform.png`;

    console.log(`[Waveform] Uploading waveform files to MinIO`);
    await storage.uploadFile(waveformsBucket, jsonKey, jsonPath, 'application/json');
    await job.updateProgress(80);

    await storage.uploadFile(waveformsBucket, pngKey, pngPath, 'image/png');
    await job.updateProgress(85);

    // Create asset records
    const jsonStats = await fs.promises.stat(jsonPath);
    const jsonAsset = assetRepo.create({
      bucket: waveformsBucket,
      key: jsonKey,
      size_bytes: jsonStats.size,
      mime: 'application/json',
      sha256: 'placeholder', // Would calculate in real system
    });
    const savedJsonAsset = await assetRepo.save(jsonAsset);

    const pngStats = await fs.promises.stat(pngPath);
    const pngAsset = assetRepo.create({
      bucket: waveformsBucket,
      key: pngKey,
      size_bytes: pngStats.size,
      mime: 'image/png',
      sha256: 'placeholder', // Would calculate in real system
    });
    const savedPngAsset = await assetRepo.save(pngAsset);

    await job.updateProgress(90);

    // Create or update waveform record
    let waveform = await waveformRepo.findOne({
      where: { track_version_id: version_id },
    });

    if (!waveform) {
      waveform = waveformRepo.create({
        track_version_id: version_id,
        json_asset_id: savedJsonAsset.id,
        png_asset_id: savedPngAsset.id,
      });
    } else {
      waveform.json_asset_id = savedJsonAsset.id;
      waveform.png_asset_id = savedPngAsset.id;
    }

    await waveformRepo.save(waveform);
    await job.updateProgress(100);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true });

    console.log(`[Waveform] Job ${job.id} completed successfully`);
    return {
      success: true,
      waveform_id: waveform.id,
      json_asset_id: savedJsonAsset.id,
      png_asset_id: savedPngAsset.id,
    };
  } catch (error) {
    console.error(`[Waveform] Job ${job.id} failed:`, error);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate waveform JSON data using audiowaveform
 * 256 samples per second, 8-bit resolution
 */
async function generateWaveformJSON(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync('audiowaveform', [
    '-i',
    inputPath,
    '-o',
    outputPath,
    '--pixels-per-second',
    '256',
    '--bits',
    '8',
  ]);
}

/**
 * Generate waveform PNG preview using audiowaveform
 * 1800x280 pixels, default colors
 */
async function generateWaveformPNG(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync('audiowaveform', [
    '-i',
    inputPath,
    '-o',
    outputPath,
    '--width',
    '1800',
    '--height',
    '280',
    '--colors',
    'audacity', // Use Audacity color scheme
  ]);
}
