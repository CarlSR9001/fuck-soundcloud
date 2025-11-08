/**
 * Artwork extraction processor
 * Extracts cover art from audio files and generates thumbnails
 */

import { Job } from 'bullmq';
import { ArtworkExtractJobData, ArtworkExtractJobResult } from '@soundcloud-clone/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { extractArtwork, resizeImage } from '../services/ffmpeg.service';
import { StorageService } from '../services/storage.service';
import { getDataSource } from '../config/typeorm.config';
import { Asset } from '../../../api/src/entities/asset.entity';
import { Track } from '../../../api/src/entities/track.entity';

const storage = new StorageService();

/**
 * Process artwork extraction job
 */
export async function processArtworkExtractJob(
  job: Job<ArtworkExtractJobData>
): Promise<ArtworkExtractJobResult> {
  const { version_id, original_asset_id } = job.data;
  const tempDir = `/tmp/artwork-${job.id}`;

  console.log(
    `[Artwork] Processing job ${job.id} for version ${version_id}, asset ${original_asset_id}`
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

    // Extract embedded artwork
    const extractedPath = path.join(tempDir, 'extracted');
    const hasArtwork = await extractArtwork(originalPath, extractedPath);

    if (!hasArtwork) {
      console.log(`[Artwork] No embedded artwork found in job ${job.id}`);
      return {
        success: true,
        artwork_asset_id: null,
        thumbnail_asset_id: null,
      };
    }

    await job.updateProgress(50);

    // Resize to 1000px (full) and 200px (thumbnail)
    const fullPath = path.join(tempDir, 'artwork_1000.jpg');
    const thumbPath = path.join(tempDir, 'artwork_200.jpg');

    await resizeImage(extractedPath, fullPath, 1000, 1000);
    await resizeImage(extractedPath, thumbPath, 200, 200);
    await job.updateProgress(70);

    // Calculate hashes and upload to MinIO
    const fullData = await fs.readFile(fullPath);
    const thumbData = await fs.readFile(thumbPath);

    const fullHash = crypto.createHash('sha256').update(fullData).digest('hex');
    const thumbHash = crypto.createHash('sha256').update(thumbData).digest('hex');

    const fullKey = `artwork/${fullHash}_1000.jpg`;
    const thumbKey = `artwork/${thumbHash}_200.jpg`;

    await storage.uploadFile('images', fullKey, fullPath, 'image/jpeg');
    await storage.uploadFile('images', thumbKey, thumbPath, 'image/jpeg');
    await job.updateProgress(85);

    // Create asset records
    const fullAsset = assetRepo.create({
      bucket: 'images',
      key: fullKey,
      size_bytes: fullData.length,
      mime: 'image/jpeg',
      sha256: fullHash,
    });

    const thumbAsset = assetRepo.create({
      bucket: 'images',
      key: thumbKey,
      size_bytes: thumbData.length,
      mime: 'image/jpeg',
      sha256: thumbHash,
    });

    await assetRepo.save([fullAsset, thumbAsset]);

    // Update track with artwork_asset_id (find track by version_id)
    const trackRepo = dataSource.getRepository(Track);
    const track = await trackRepo
      .createQueryBuilder('track')
      .innerJoin('track.versions', 'version')
      .where('version.id = :version_id', { version_id })
      .getOne();

    if (track) {
      track.artwork_asset_id = fullAsset.id;
      await trackRepo.save(track);
    }

    await job.updateProgress(100);

    console.log(
      `[Artwork] Successfully extracted artwork for job ${job.id}: full=${fullAsset.id}, thumb=${thumbAsset.id}`
    );

    return {
      success: true,
      artwork_asset_id: fullAsset.id,
      thumbnail_asset_id: thumbAsset.id,
    };
  } catch (error: any) {
    console.error(`[Artwork] Error in job ${job.id}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error during artwork extraction',
    };
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[Artwork] Failed to cleanup temp dir ${tempDir}:`, err);
    }
  }
}
