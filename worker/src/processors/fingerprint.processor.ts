/**
 * Fingerprint job processor
 * Generates audio fingerprints using Chromaprint (fpcalc)
 * Checks for duplicates and optionally queries AcoustID API
 */

import { Job } from 'bullmq';
import { FingerprintJobData, FingerprintJobResult } from '@soundcloud-clone/shared';
import { getDataSource } from '../config/typeorm.config';
import { StorageService } from '../services/storage.service';
import {
  TrackVersion,
  Asset,
  AudioFingerprint,
  Report,
  Track,
} from '../../../api/src/entities';
import { ReportReason, ReportStatus } from '../../../api/src/entities/report.entity';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FpcalcOutput {
  fingerprint: string;
  duration: number;
}

/**
 * Run fpcalc CLI to generate Chromaprint fingerprint
 */
async function generateFingerprint(inputPath: string): Promise<FpcalcOutput> {
  try {
    const { stdout } = await execAsync(`fpcalc -json "${inputPath}"`);
    const result = JSON.parse(stdout);

    if (!result.fingerprint) {
      throw new Error('fpcalc did not return a fingerprint');
    }

    return {
      fingerprint: result.fingerprint,
      duration: Math.floor(result.duration || 0),
    };
  } catch (error) {
    throw new Error(`fpcalc failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check for duplicate fingerprints in database
 * Returns track_id if duplicate found
 */
async function checkForDuplicates(
  fingerprint: string,
  currentVersionId: string
): Promise<string | null> {
  const dataSource = getDataSource();
  const fingerprintRepo = dataSource.getRepository(AudioFingerprint);

  // Find fingerprints with exact match
  const matches = await fingerprintRepo.find({
    where: { fingerprint },
    relations: ['track_version'],
  });

  // Filter out current track version
  const otherMatches = matches.filter(m => m.track_version_id !== currentVersionId);

  if (otherMatches.length > 0) {
    // Get track_id from first match
    const trackVersionRepo = dataSource.getRepository(TrackVersion);
    const matchedVersion = await trackVersionRepo.findOne({
      where: { id: otherMatches[0].track_version_id },
    });

    return matchedVersion?.track_id || null;
  }

  return null;
}

/**
 * Query AcoustID API for external matching (optional)
 */
async function queryAcoustID(
  fingerprint: string,
  duration: number
): Promise<{ acoustid?: string; musicbrainz_id?: string }> {
  // In production, would query: https://api.acoustid.org/v2/lookup
  // Requires API key from environment
  // For now, return empty to avoid external dependencies

  const apiKey = process.env.ACOUSTID_API_KEY;
  if (!apiKey) {
    console.log('[Fingerprint] ACOUSTID_API_KEY not set, skipping external lookup');
    return {};
  }

  try {
    // Would make HTTP request here
    // const response = await fetch(`https://api.acoustid.org/v2/lookup?client=${apiKey}&duration=${duration}&fingerprint=${fingerprint}&meta=recordings`);
    // const data = await response.json();
    // Parse and return acoustid and musicbrainz_id

    return {};
  } catch (error) {
    console.error('[Fingerprint] AcoustID query failed:', error);
    return {};
  }
}

/**
 * Create duplicate report if fingerprint matches existing track
 */
async function createDuplicateReport(
  trackId: string,
  duplicateTrackId: string
): Promise<void> {
  const dataSource = getDataSource();
  const reportRepo = dataSource.getRepository(Report);
  const trackRepo = dataSource.getRepository(Track);

  const track = await trackRepo.findOne({ where: { id: trackId } });
  if (!track) return;

  // Create automated report
  const report = reportRepo.create({
    reporter_id: track.owner_user_id,
    track_id: trackId,
    reason: ReportReason.COPYRIGHT_INFRINGEMENT,
    details: `Automated duplicate detection: This track's audio fingerprint matches track ${duplicateTrackId}. Please verify originality.`,
    evidence_url: null,
    status: ReportStatus.PENDING,
  });

  await reportRepo.save(report);
  console.log(`[Fingerprint] Created duplicate report for track ${trackId}`);
}

/**
 * Process fingerprint job
 */
export async function processFingerprintJob(
  job: Job<FingerprintJobData>
): Promise<FingerprintJobResult> {
  const { version_id } = job.data;
  const storage = new StorageService();
  const workDir = `/tmp/fingerprint-${job.id}`;

  console.log(`[Fingerprint] Processing job ${job.id} for version ${version_id}`);

  try {
    await fs.promises.mkdir(workDir, { recursive: true });
    await job.updateProgress(5);

    // Fetch entities from database
    const dataSource = getDataSource();
    const trackVersionRepo = dataSource.getRepository(TrackVersion);
    const assetRepo = dataSource.getRepository(Asset);
    const fingerprintRepo = dataSource.getRepository(AudioFingerprint);

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
    console.log(`[Fingerprint] Downloading ${originalAsset.bucket}/${originalAsset.key}`);
    await storage.downloadFile(originalAsset.bucket, originalAsset.key, inputPath);
    await job.updateProgress(30);

    // Generate fingerprint using fpcalc
    console.log(`[Fingerprint] Running fpcalc on ${inputPath}`);
    const { fingerprint, duration } = await generateFingerprint(inputPath);
    await job.updateProgress(60);

    // Check for duplicates
    console.log(`[Fingerprint] Checking for duplicates`);
    const duplicateTrackId = await checkForDuplicates(fingerprint, version_id);
    await job.updateProgress(70);

    // Query AcoustID if configured
    console.log(`[Fingerprint] Querying AcoustID (optional)`);
    const { acoustid, musicbrainz_id } = await queryAcoustID(fingerprint, duration);
    await job.updateProgress(80);

    // Store fingerprint in database
    const audioFingerprint = fingerprintRepo.create({
      track_version_id: version_id,
      fingerprint,
      duration,
      acoustid: acoustid || null,
      musicbrainz_id: musicbrainz_id || null,
    });

    const savedFingerprint = await fingerprintRepo.save(audioFingerprint);
    await job.updateProgress(90);

    // Create duplicate report if needed
    if (duplicateTrackId) {
      await createDuplicateReport(trackVersion.track_id, duplicateTrackId);
    }

    await job.updateProgress(100);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true });

    console.log(`[Fingerprint] Job ${job.id} completed successfully`);
    return {
      success: true,
      fingerprint_id: savedFingerprint.id,
      fingerprint,
      duration,
      duplicate_found: !!duplicateTrackId,
      duplicate_track_id: duplicateTrackId || undefined,
      acoustid: acoustid || undefined,
    };
  } catch (error) {
    console.error(`[Fingerprint] Job ${job.id} failed:`, error);

    // Cleanup
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
