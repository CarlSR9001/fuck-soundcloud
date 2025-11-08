/**
 * Queue configuration
 * Redis and BullMQ settings
 */

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency: {
    transcode: number;
    waveform: number;
    artwork: number;
    loudness: number;
    analytics: number;
    fingerprint: number;
    distribution: number;
  };
  retries: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
  };
}

/**
 * Load queue configuration from environment
 */
export function loadQueueConfig(): QueueConfig {
  return {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    concurrency: {
      transcode: parseInt(process.env.TRANSCODE_CONCURRENCY || '2', 10),
      waveform: parseInt(process.env.WAVEFORM_CONCURRENCY || '4', 10),
      artwork: parseInt(process.env.ARTWORK_CONCURRENCY || '4', 10),
      loudness: parseInt(process.env.LOUDNESS_CONCURRENCY || '4', 10),
      analytics: parseInt(process.env.ANALYTICS_CONCURRENCY || '1', 10),
      fingerprint: parseInt(process.env.FINGERPRINT_CONCURRENCY || '2', 10),
      distribution: parseInt(process.env.DISTRIBUTION_CONCURRENCY || '1', 10),
    },
    retries: {
      attempts: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3', 10),
      backoff: {
        type: (process.env.JOB_BACKOFF_TYPE as 'exponential' | 'fixed') || 'exponential',
        delay: parseInt(process.env.JOB_BACKOFF_DELAY || '5000', 10),
      },
    },
  };
}
