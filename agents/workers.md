# Background Jobs & Workers

**Purpose:** Worker job specifications, FFmpeg processing, queue management, retry logic, and error handling patterns.

**Prerequisites:**
- Read `architecture.md` for data models and media workflow
- Read `api-specs.md` for job triggering endpoints

---

## Worker Architecture

### Queue System (BullMQ + Redis)

**Queues:**
1. `transcode` - Audio transcoding to HLS formats
2. `waveform` - Waveform JSON/PNG generation
3. `artwork-extract` - Cover art extraction from audio files
4. `loudness` - EBU R128 loudness analysis
5. `analytics-rollup` - Daily analytics aggregation
6. `fingerprint` - Audio fingerprinting (Chromaprint)
7. `distribution` - Monthly payment distribution (M5)

**Configuration:**
```typescript
// worker/src/config/queue.config.ts
export const QUEUE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  queues: {
    transcode: {
      name: 'transcode',
      concurrency: 2, // Max 2 simultaneous transcodes
      limiter: {
        max: 10,      // Max 10 jobs per
        duration: 60000, // 60 seconds
      },
    },
    waveform: {
      name: 'waveform',
      concurrency: 4,
    },
    // ... etc
  },
};
```

### Worker Process

**File:** `worker/src/main.ts`

```typescript
import { Queue, Worker } from 'bullmq';
import { QUEUE_CONFIG } from './config/queue.config';
import { TranscodeProcessor } from './processors/transcode.processor';
import { WaveformProcessor } from './processors/waveform.processor';

// Initialize processors
const transcodeProcessor = new TranscodeProcessor();
const waveformProcessor = new WaveformProcessor();

// Create workers
const transcodeWorker = new Worker(
  'transcode',
  async (job) => transcodeProcessor.process(job),
  {
    connection: QUEUE_CONFIG.redis,
    concurrency: QUEUE_CONFIG.queues.transcode.concurrency,
  }
);

// Error handling
transcodeWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await transcodeWorker.close();
  process.exit(0);
});
```

---

## Job 1: Transcode Job

### Purpose

Convert uploaded audio files to HLS streaming formats:
- **Primary:** HLS (fMP4/CMAF) + Opus 160 kbps
- **Compatibility:** HLS AAC 256 kbps (optional)
- **Lossless:** HLS ALAC (whitelisted users only)

### Job Data

```typescript
interface TranscodeJobData {
  version_id: string;
  asset_id: string;
  formats: ('hls_opus' | 'hls_aac' | 'hls_alac')[];
}
```

### Implementation

```typescript
// worker/src/processors/transcode.processor.ts
export class TranscodeProcessor {
  async process(job: Job<TranscodeJobData>) {
    const { version_id, asset_id, formats } = job.data;

    try {
      // 1. Download original from MinIO
      const inputPath = await this.storage.download(asset_id);

      // 2. Update status to processing
      await this.db.trackVersions.update(version_id, {
        status: 'processing',
      });

      // 3. Transcode to each format
      for (const format of formats) {
        await this.transcodeToFormat(inputPath, version_id, format, job);
      }

      // 4. Update status to ready
      await this.db.trackVersions.update(version_id, {
        status: 'ready',
      });

      // 5. Cleanup temp file
      await fs.unlink(inputPath);

    } catch (error) {
      // Mark as failed
      await this.db.trackVersions.update(version_id, {
        status: 'failed',
        error: error.message,
      });
      throw error; // Re-throw for BullMQ retry logic
    }
  }

  private async transcodeToFormat(
    inputPath: string,
    versionId: string,
    format: string,
    job: Job
  ) {
    const outputDir = `/tmp/transcode-${versionId}-${format}`;
    await fs.mkdir(outputDir, { recursive: true });

    if (format === 'hls_opus') {
      await this.transcodeHLSOpus(inputPath, outputDir, job);
    } else if (format === 'hls_aac') {
      await this.transcodeHLSAAC(inputPath, outputDir, job);
    } else if (format === 'hls_alac') {
      await this.transcodeHLSALAC(inputPath, outputDir, job);
    }

    // Upload playlist and segments to MinIO
    await this.uploadTranscode(versionId, format, outputDir);

    // Create transcode record in database
    await this.db.transcodes.create({
      track_version_id: versionId,
      format,
      playlist_asset_id: /* asset ID of playlist.m3u8 */,
      segment_prefix_key: `${versionId}/${format}/`,
      status: 'ready',
    });

    // Cleanup temp directory
    await fs.rm(outputDir, { recursive: true });
  }

  private async transcodeHLSOpus(
    inputPath: string,
    outputDir: string,
    job: Job
  ) {
    const playlistPath = path.join(outputDir, 'playlist.m3u8');

    // FFmpeg command for HLS + Opus
    const cmd = [
      'ffmpeg',
      '-i', inputPath,
      '-c:a', 'libopus',
      '-b:a', '160k',
      '-vn', // No video
      '-f', 'hls',
      '-hls_time', '6', // 6-second segments
      '-hls_list_size', '0', // Include all segments
      '-hls_segment_type', 'fmp4', // fMP4/CMAF format
      '-hls_fmp4_init_filename', 'init.mp4',
      '-hls_segment_filename', path.join(outputDir, 'segment_%03d.m4s'),
      playlistPath,
    ].join(' ');

    // Execute with progress reporting
    await this.executeFFmpeg(cmd, (progress) => {
      job.updateProgress(progress);
    });
  }

  private async executeFFmpeg(cmd: string, onProgress?: (percent: number) => void) {
    return new Promise((resolve, reject) => {
      const proc = spawn('sh', ['-c', cmd]);

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();

        // Parse FFmpeg progress
        const match = stderr.match(/time=(\d+):(\d+):(\d+)/);
        if (match && onProgress) {
          const seconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
          // Calculate percentage (if duration known)
          onProgress(seconds);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
}
```

### FFmpeg Commands Reference

**HLS Opus (Primary):**
```bash
ffmpeg -i input.wav \
  -c:a libopus -b:a 160k \
  -f hls -hls_time 6 -hls_segment_type fmp4 \
  -hls_segment_filename segment_%03d.m4s \
  playlist.m3u8
```

**HLS AAC (Compatibility):**
```bash
ffmpeg -i input.wav \
  -c:a aac -b:a 256k \
  -f hls -hls_time 6 -hls_segment_type fmp4 \
  -hls_segment_filename segment_%03d.m4s \
  playlist.m3u8
```

**HLS ALAC (Lossless):**
```bash
ffmpeg -i input.flac \
  -c:a alac \
  -f hls -hls_time 6 -hls_segment_type fmp4 \
  -hls_segment_filename segment_%03d.m4s \
  playlist.m3u8
```

### Segment Requirements

- **Duration:** 6 seconds (configurable)
- **Keyframe alignment:** Every segment starts with keyframe
- **Naming:** `segment_000.m4s`, `segment_001.m4s`, etc.
- **Init segment:** `init.mp4` (contains codec metadata)
- **Playlist:** `playlist.m3u8` (references all segments)

### Retry Policy

```typescript
// API enqueues job with retry config
await transcodeQueue.add('transcode', jobData, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // Start with 5s, then 10s, then 20s
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep failed jobs for debugging
});
```

---

## Job 2: Waveform Job

### Purpose

Generate waveform JSON and PNG for player visualization.

### Job Data

```typescript
interface WaveformJobData {
  version_id: string;
  asset_id: string;
}
```

### Implementation

```typescript
export class WaveformProcessor {
  async process(job: Job<WaveformJobData>) {
    const { version_id, asset_id } = job.data;

    // 1. Download original from MinIO
    const inputPath = await this.storage.download(asset_id);

    // 2. Generate waveform JSON
    const jsonPath = `/tmp/waveform-${version_id}.json`;
    await this.generateWaveformJSON(inputPath, jsonPath);

    // 3. Generate waveform PNG
    const pngPath = `/tmp/waveform-${version_id}.png`;
    await this.generateWaveformPNG(inputPath, pngPath);

    // 4. Upload to MinIO
    const jsonAssetId = await this.storage.upload(jsonPath, 'waveforms');
    const pngAssetId = await this.storage.upload(pngPath, 'waveforms');

    // 5. Create waveform record
    await this.db.waveforms.create({
      track_version_id: version_id,
      json_asset_id: jsonAssetId,
      png_asset_id: pngAssetId,
    });

    // 6. Cleanup
    await fs.unlink(inputPath);
    await fs.unlink(jsonPath);
    await fs.unlink(pngPath);
  }

  private async generateWaveformJSON(inputPath: string, outputPath: string) {
    // audiowaveform command
    const cmd = [
      'audiowaveform',
      '-i', inputPath,
      '-o', outputPath,
      '--bits', '8',
      '--pixels-per-second', '20', // 20 samples per second
    ].join(' ');

    await exec(cmd);
  }

  private async generateWaveformPNG(inputPath: string, outputPath: string) {
    const cmd = [
      'audiowaveform',
      '-i', inputPath,
      '-o', outputPath,
      '--width', '1800',
      '--height', '280',
      '--colors', 'audacity', // Color scheme
    ].join(' ');

    await exec(cmd);
  }
}
```

### Output Format (JSON)

```json
{
  "version": 2,
  "channels": 2,
  "sample_rate": 48000,
  "samples_per_pixel": 256,
  "bits": 8,
  "length": 240000,
  "data": [0, 45, 78, 120, 98, 67, 56, 89, ...]
}
```

---

## Job 3: Artwork Extract Job

### Purpose

Extract embedded cover art from audio file; generate thumbnail.

### Implementation

```typescript
export class ArtworkExtractProcessor {
  async process(job: Job<{ version_id: string; asset_id: string }>) {
    const { version_id, asset_id } = job.data;

    // 1. Download original
    const inputPath = await this.storage.download(asset_id);

    // 2. Extract cover art with FFmpeg
    const coverPath = `/tmp/cover-${version_id}.jpg`;
    await this.extractCover(inputPath, coverPath);

    // 3. If no embedded cover, use default
    if (!fs.existsSync(coverPath)) {
      // Copy default artwork
      await fs.copyFile('/app/assets/default-artwork.jpg', coverPath);
    }

    // 4. Generate thumbnail (200x200)
    const thumbPath = `/tmp/thumb-${version_id}.jpg`;
    await this.resizeImage(coverPath, thumbPath, 200, 200);

    // 5. Upload both to MinIO
    const fullAssetId = await this.storage.upload(coverPath, 'images');
    const thumbAssetId = await this.storage.upload(thumbPath, 'images');

    // 6. Update track with artwork asset IDs
    await this.db.tracks.update(/* track_id */, {
      artwork_asset_id: fullAssetId,
    });

    // Cleanup
    await fs.unlink(inputPath);
    await fs.unlink(coverPath);
    await fs.unlink(thumbPath);
  }

  private async extractCover(inputPath: string, outputPath: string) {
    const cmd = `ffmpeg -i ${inputPath} -an -vcodec copy ${outputPath}`;
    try {
      await exec(cmd);
    } catch (error) {
      // No embedded cover, that's okay
    }
  }

  private async resizeImage(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number
  ) {
    // Using ImageMagick or sharp
    const cmd = `convert ${inputPath} -resize ${width}x${height}^ -gravity center -extent ${width}x${height} ${outputPath}`;
    await exec(cmd);
  }
}
```

---

## Job 4: Loudness Analysis Job

### Purpose

Calculate EBU R128 integrated loudness for normalization.

### Implementation

```typescript
export class LoudnessProcessor {
  async process(job: Job<{ version_id: string; asset_id: string }>) {
    const { version_id, asset_id } = job.data;

    // 1. Download original
    const inputPath = await this.storage.download(asset_id);

    // 2. Run FFmpeg with ebur128 filter
    const result = await this.analyzeLoudness(inputPath);

    // 3. Update track_version with loudness data
    await this.db.trackVersions.update(version_id, {
      loudness_lufs: result.integrated,
      loudness_range: result.range,
      true_peak: result.truePeak,
    });

    // Cleanup
    await fs.unlink(inputPath);
  }

  private async analyzeLoudness(inputPath: string): Promise<{
    integrated: number;
    range: number;
    truePeak: number;
  }> {
    const cmd = [
      'ffmpeg',
      '-i', inputPath,
      '-filter:a', 'ebur128=peak=true',
      '-f', 'null',
      '-',
    ].join(' ');

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        // Parse stderr for loudness values
        const integratedMatch = stderr.match(/I:\s*(-?\d+\.\d+)\s*LUFS/);
        const rangeMatch = stderr.match(/LRA:\s*(\d+\.\d+)\s*LU/);
        const peakMatch = stderr.match(/Peak:\s*(-?\d+\.\d+)\s*dBFS/);

        if (integratedMatch) {
          resolve({
            integrated: parseFloat(integratedMatch[1]),
            range: rangeMatch ? parseFloat(rangeMatch[1]) : 0,
            truePeak: peakMatch ? parseFloat(peakMatch[1]) : 0,
          });
        } else {
          reject(new Error('Could not parse loudness data'));
        }
      });
    });
  }
}
```

---

## Job 5: Analytics Rollup Job

### Purpose

Aggregate daily analytics from `analytics_play` into `analytics_daily`.

### Scheduling

**Cron:** Run daily at 1 AM UTC

```typescript
// API schedules recurring job
import { CronJob } from 'cron';

new CronJob('0 1 * * *', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await analyticsQueue.add('rollup', {
    day: yesterday.toISOString().split('T')[0], // YYYY-MM-DD
  });
}).start();
```

### Implementation

```typescript
export class AnalyticsRollupProcessor {
  async process(job: Job<{ day: string }>) {
    const { day } = job.data;

    // Query all plays for the day
    const plays = await this.db.analyticsPlay.findAll({
      where: {
        started_at: {
          gte: new Date(`${day}T00:00:00Z`),
          lt: new Date(`${day}T23:59:59Z`),
        },
      },
    });

    // Group by track_id
    const trackStats = new Map<string, {
      plays: number;
      uniques: Set<string>;
      completions: number;
    }>();

    for (const play of plays) {
      if (!trackStats.has(play.track_id)) {
        trackStats.set(play.track_id, {
          plays: 0,
          uniques: new Set(),
          completions: 0,
        });
      }

      const stats = trackStats.get(play.track_id)!;
      stats.plays++;
      stats.uniques.add(play.ip_hash || play.user_id);
      if (play.completed) stats.completions++;
    }

    // Upsert into analytics_daily
    for (const [track_id, stats] of trackStats.entries()) {
      await this.db.analyticsDaily.upsert({
        track_id,
        day,
        plays: stats.plays,
        uniques: stats.uniques.size,
        completions: stats.completions,
      });
    }

    // Also aggregate likes, reposts, downloads from other tables
    await this.aggregateSocialStats(day);
  }
}
```

---

## Job 6: Fingerprint Job (M5)

### Purpose

Generate audio fingerprint for duplicate detection.

### Implementation

```typescript
export class FingerprintProcessor {
  async process(job: Job<{ version_id: string; asset_id: string }>) {
    const { version_id, asset_id } = job.data;

    // 1. Download original
    const inputPath = await this.storage.download(asset_id);

    // 2. Generate fingerprint with fpcalc (Chromaprint)
    const fingerprint = await this.generateFingerprint(inputPath);

    // 3. Check for duplicates
    const duplicates = await this.db.audioFingerprints.findAll({
      where: { fingerprint_hash: fingerprint.hash },
    });

    if (duplicates.length > 0) {
      // Create report for admin review
      await this.db.reports.create({
        target_type: 'track',
        target_id: /* track_id */,
        reason: 'duplicate',
        description: `Possible duplicate of track ${duplicates[0].track_version_id}`,
        status: 'pending',
      });
    }

    // 4. Store fingerprint
    await this.db.audioFingerprints.create({
      track_version_id: version_id,
      fingerprint_hash: fingerprint.hash,
      chromaprint_data: fingerprint.data,
    });

    // Cleanup
    await fs.unlink(inputPath);
  }

  private async generateFingerprint(inputPath: string): Promise<{
    hash: string;
    data: string;
  }> {
    const cmd = `fpcalc -json ${inputPath}`;
    const { stdout } = await exec(cmd);
    const result = JSON.parse(stdout);

    return {
      hash: crypto.createHash('sha256').update(result.fingerprint).digest('hex'),
      data: result.fingerprint,
    };
  }
}
```

---

## Job 7: Distribution Job (M5)

### Purpose

Monthly payment distribution to artists based on user-centric listening.

### Scheduling

**Cron:** Run monthly on 1st day at 2 AM UTC

```typescript
new CronJob('0 2 1 * *', async () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await distributionQueue.add('distribute', {
    period_start: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
    period_end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
  });
}).start();
```

### Implementation

```typescript
export class DistributionProcessor {
  async process(job: Job<{ period_start: Date; period_end: Date }>) {
    const { period_start, period_end } = job.data;

    // 1. Get all contributions for the period
    const contributions = await this.db.contributions.findAll({
      where: {
        created_at: { gte: period_start, lte: period_end },
        status: 'succeeded',
      },
    });

    // 2. Group by user
    const userPools = new Map<string, number>();
    for (const contrib of contributions) {
      const artistShare = (contrib.amount_cents * contrib.artist_percent) / 100;
      userPools.set(
        contrib.user_id,
        (userPools.get(contrib.user_id) || 0) + artistShare
      );
    }

    // 3. For each user, distribute their pool to artists they listened to
    for (const [user_id, pool] of userPools.entries()) {
      await this.distributeUserPool(user_id, pool, period_start, period_end);
    }

    // 4. Update charity totals
    await this.distributeToCharities(contributions);
  }

  private async distributeUserPool(
    userId: string,
    poolCents: number,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get user's listening time per artist
    const plays = await this.db.analyticsPlay.findAll({
      where: {
        user_id: userId,
        started_at: { gte: periodStart, lte: periodEnd },
      },
      include: ['track'],
    });

    // Calculate listening time per artist
    const artistTime = new Map<string, number>();
    for (const play of plays) {
      const artistId = play.track.owner_user_id;
      artistTime.set(
        artistId,
        (artistTime.get(artistId) || 0) + play.watch_ms
      );
    }

    const totalTime = Array.from(artistTime.values()).reduce((a, b) => a + b, 0);

    // Distribute proportionally
    for (const [artistId, time] of artistTime.entries()) {
      const share = Math.floor((poolCents * time) / totalTime);

      if (share > 0) {
        // Create or update artist payout
        await this.db.artistPayouts.upsert({
          artist_id: artistId,
          period_start: periodStart,
          period_end: periodEnd,
          total_cents: { increment: share },
          contribution_count: { increment: 1 },
          listener_count: { increment: 1 },
        });
      }
    }
  }
}
```

---

## Error Handling Patterns

### Graceful Degradation

**Strategy:** If non-critical job fails, don't block track publish

```typescript
// In transcode processor
try {
  await this.generateWaveform(version_id); // Non-critical
} catch (error) {
  logger.warn('Waveform generation failed, continuing anyway', error);
  // Track still marked as ready
}
```

### Dead Letter Queue

**Failed jobs after max retries:**
```typescript
// In worker setup
const worker = new Worker('transcode', processor, {
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 3,
  },
});

worker.on('failed', async (job, error) => {
  if (job.attemptsMade >= job.opts.attempts) {
    // Move to dead letter queue
    await deadLetterQueue.add('failed-transcode', {
      original_job: job.data,
      error: error.message,
      attempts: job.attemptsMade,
    });

    // Notify admin
    await this.notifyAdmin(`Job ${job.id} failed permanently`);
  }
});
```

---

## Monitoring & Observability

### Health Checks

**Endpoint:** `GET http://worker:3001/health`

```typescript
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  queues: Record<string, { waiting: number; active: number; failed: number }>;
}> {
  const queues = ['transcode', 'waveform', 'artwork-extract', 'loudness', 'analytics-rollup'];
  const stats = {};

  for (const queueName of queues) {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts();

    stats[queueName] = {
      waiting: counts.waiting,
      active: counts.active,
      failed: counts.failed,
    };
  }

  // Unhealthy if any queue has > 100 failed jobs
  const totalFailed = Object.values(stats).reduce((sum, q: any) => sum + q.failed, 0);
  const status = totalFailed > 100 ? 'unhealthy' : 'healthy';

  return { status, queues: stats };
}
```

### Metrics

**Track these:**
- Jobs processed per minute (by queue)
- Average job duration (by queue)
- Failure rate (%)
- Queue depth (waiting jobs)
- Worker CPU/memory usage

**Export to Prometheus:**
```typescript
import { register, Counter, Histogram } from 'prom-client';

const jobsProcessed = new Counter({
  name: 'worker_jobs_processed_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'],
});

const jobDuration = new Histogram({
  name: 'worker_job_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// In worker
worker.on('completed', (job) => {
  jobsProcessed.inc({ queue: job.queueName, status: 'success' });
  jobDuration.observe({ queue: job.queueName }, job.finishedOn - job.processedOn);
});
```

---

## Scaling Workers

### Horizontal Scaling

**Run multiple worker instances:**
```bash
docker compose up --scale worker=4
```

**Each instance:**
- Connects to same Redis
- Processes jobs from shared queue
- BullMQ handles job locking (no duplicates)

### Priority Queues

**Critical jobs first:**
```typescript
await transcodeQueue.add('transcode', jobData, {
  priority: 1, // Higher priority = processed first
});

await waveformQueue.add('waveform', jobData, {
  priority: 10, // Lower priority
});
```

### Resource Management

**Limit concurrency based on CPU:**
```typescript
const cpuCount = os.cpus().length;

new Worker('transcode', processor, {
  concurrency: Math.max(1, cpuCount - 1), // Leave 1 CPU free
});
```
