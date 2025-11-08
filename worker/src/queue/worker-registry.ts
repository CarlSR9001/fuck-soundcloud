/**
 * Worker registry
 * Registers all job processors with their respective queues
 */

import { Worker, ConnectionOptions } from 'bullmq';
import { QueueManager } from './queue-manager';
import { QueueConfig } from '../config/queue.config';
import {
  TRANSCODE_JOB,
  WAVEFORM_JOB,
  ARTWORK_EXTRACT_JOB,
  LOUDNESS_JOB,
  ANALYTICS_ROLLUP_JOB,
  FINGERPRINT_JOB,
  DISTRIBUTION_JOB,
} from '@soundcloud-clone/shared';
import {
  processTranscodeJob,
  processWaveformJob,
  processArtworkExtractJob,
  processLoudnessJob,
  processAnalyticsRollupJob,
  processFingerprintJob,
  processDistributionJob,
} from '../processors';

export class WorkerRegistry {
  constructor(
    private queueManager: QueueManager,
    private config: QueueConfig
  ) {}

  /**
   * Register all workers
   */
  registerAllWorkers(): void {
    const connection: ConnectionOptions = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
    };

    // Register transcode worker
    const transcodeWorker = new Worker(TRANSCODE_JOB, processTranscodeJob, {
      connection,
      concurrency: this.config.concurrency.transcode,
    });
    this.queueManager.registerWorker(TRANSCODE_JOB, transcodeWorker);

    // Register waveform worker
    const waveformWorker = new Worker(WAVEFORM_JOB, processWaveformJob, {
      connection,
      concurrency: this.config.concurrency.waveform,
    });
    this.queueManager.registerWorker(WAVEFORM_JOB, waveformWorker);

    // Register artwork extract worker
    const artworkWorker = new Worker(ARTWORK_EXTRACT_JOB, processArtworkExtractJob, {
      connection,
      concurrency: this.config.concurrency.artwork,
    });
    this.queueManager.registerWorker(ARTWORK_EXTRACT_JOB, artworkWorker);

    // Register loudness worker
    const loudnessWorker = new Worker(LOUDNESS_JOB, processLoudnessJob, {
      connection,
      concurrency: this.config.concurrency.loudness,
    });
    this.queueManager.registerWorker(LOUDNESS_JOB, loudnessWorker);

    // Register analytics rollup worker
    const analyticsWorker = new Worker(ANALYTICS_ROLLUP_JOB, processAnalyticsRollupJob, {
      connection,
      concurrency: this.config.concurrency.analytics,
    });
    this.queueManager.registerWorker(ANALYTICS_ROLLUP_JOB, analyticsWorker);

    // Register fingerprint worker
    const fingerprintWorker = new Worker(FINGERPRINT_JOB, processFingerprintJob, {
      connection,
      concurrency: this.config.concurrency.fingerprint,
    });
    this.queueManager.registerWorker(FINGERPRINT_JOB, fingerprintWorker);

    // Register distribution worker
    const distributionWorker = new Worker(DISTRIBUTION_JOB, processDistributionJob, {
      connection,
      concurrency: this.config.concurrency.distribution, // Only one distribution job should run at a time
    });
    this.queueManager.registerWorker(DISTRIBUTION_JOB, distributionWorker);

    console.log('All workers registered successfully');
  }
}
