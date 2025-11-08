/**
 * Transcode job processor
 * Handles audio transcoding to HLS Opus format using FFmpeg
 */

import { Job, Queue } from 'bullmq';
import { TranscodeJobData, TranscodeJobResult, FINGERPRINT_JOB } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import { StorageService } from '../services/storage.service';
import { extractMetadata, transcodeToHLS } from '../services/ffmpeg.service';
import {
  TrackVersion,
  Asset,
  Transcode,
  TranscodeStatus,
} from '../../../api/src/entities';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { QueueConfig } from '../config/queue.config';
import { ConnectionOptions } from 'bullmq';

/**
 * Process transcode job
 */
export async function processTranscodeJob(
  job: Job<TranscodeJobData>
): Promise<TranscodeJobResult> {
  const { version_id, format } = job.data;
  const storage = new StorageService();
  const workDir = `/tmp/transcode-${job.id}`;

  console.log(`[Transcode] Processing job ${job.id} for version ${version_id}, format ${format}`);

  try {
    await fs.promises.mkdir(workDir, { recursive: true });
    await job.updateProgress(5);

    // Fetch entities from database
    const dataSource = getDataSource();
    const trackVersionRepo = dataSource.getRepository(TrackVersion);
    const assetRepo = dataSource.getRepository(Asset);
    const transcodeRepo = dataSource.getRepository(Transcode);

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
    console.log(`[Transcode] Downloading ${originalAsset.bucket}/${originalAsset.key}`);
    await storage.downloadFile(originalAsset.bucket, originalAsset.key, inputPath);
    await job.updateProgress(20);

    // Extract metadata using ffprobe
    console.log(`[Transcode] Extracting metadata with ffprobe`);
    const metadata = await extractMetadata(inputPath);
    await job.updateProgress(25);

    // Update track version with metadata
    await trackVersionRepo.update(version_id, {
      duration_ms: metadata.duration_ms,
      sample_rate: metadata.sample_rate,
      channels: metadata.channels,
    });

    // Transcode to HLS Opus format
    console.log(`[Transcode] Transcoding to HLS Opus (160kbps)`);
    const outputDir = path.join(workDir, 'output');
    await fs.promises.mkdir(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, 'playlist.m3u8');
    await transcodeToHLS(inputPath, outputDir, playlistPath);
    await job.updateProgress(80);

    // Upload segments and playlist to MinIO
    console.log(`[Transcode] Uploading HLS files to MinIO`);
    const segmentPrefix = `tracks/${version_id}/${format}/${randomUUID()}`;
    const transcodesBucket = storage.getBucket('transcodes');

    const files = await fs.promises.readdir(outputDir);
    let playlistAssetId: string | undefined;
    let segmentCount = 0;

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const objectKey = `${segmentPrefix}/${file}`;
      const contentType = file.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/mp4';

      await storage.uploadFile(transcodesBucket, objectKey, filePath, contentType);

      if (file === 'playlist.m3u8') {
        // Create asset record for playlist
        const stats = await fs.promises.stat(filePath);
        const playlistAsset = assetRepo.create({
          bucket: transcodesBucket,
          key: objectKey,
          size_bytes: stats.size,
          mime: contentType,
          sha256: 'placeholder', // Would calculate in real system
        });
        const savedAsset = await assetRepo.save(playlistAsset);
        playlistAssetId = savedAsset.id;
      } else if (file.endsWith('.m4s')) {
        segmentCount++;
      }
    }

    await job.updateProgress(90);

    // Create or update transcode record
    let transcode = await transcodeRepo.findOne({
      where: { track_version_id: version_id, format },
    });

    if (!transcode) {
      transcode = transcodeRepo.create({
        track_version_id: version_id,
        format,
        playlist_asset_id: playlistAssetId,
        segment_prefix_key: segmentPrefix,
        status: TranscodeStatus.READY,
      });
    } else {
      transcode.playlist_asset_id = playlistAssetId || null;
      transcode.segment_prefix_key = segmentPrefix;
      transcode.status = TranscodeStatus.READY;
      transcode.error_message = null;
    }

    await transcodeRepo.save(transcode);
    await job.updateProgress(95);

    // Enqueue fingerprint job for copyright protection
    try {
      const queueConfig = new QueueConfig();
      const connection: ConnectionOptions = {
        host: queueConfig.redis.host,
        port: queueConfig.redis.port,
        password: queueConfig.redis.password,
      };
      const fingerprintQueue = new Queue(FINGERPRINT_JOB, { connection });
      await fingerprintQueue.add(FINGERPRINT_JOB, { version_id });
      console.log(`[Transcode] Enqueued fingerprint job for version ${version_id}`);
    } catch (error) {
      console.error(`[Transcode] Failed to enqueue fingerprint job:`, error);
      // Don't fail the transcode job if fingerprint enqueue fails
    }

    await job.updateProgress(100);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true });

    console.log(`[Transcode] Job ${job.id} completed successfully`);
    return {
      success: true,
      transcode_id: transcode.id,
      playlist_asset_id: playlistAssetId,
      segment_count: segmentCount,
    };
  } catch (error) {
    console.error(`[Transcode] Job ${job.id} failed:`, error);

    // Update transcode status to failed
    try {
      const dataSource = getDataSource();
      const transcodeRepo = dataSource.getRepository(Transcode);
      await transcodeRepo.update(
        { track_version_id: version_id, format },
        {
          status: TranscodeStatus.FAILED,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } catch (dbError) {
      console.error(`[Transcode] Failed to update status:`, dbError);
    }

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      transcode_id: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
