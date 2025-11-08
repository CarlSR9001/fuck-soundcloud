/**
 * Queue manager
 * Initializes and manages BullMQ queues and workers
 */

import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { QueueConfig } from '../config/queue.config';
import {
  TRANSCODE_JOB,
  WAVEFORM_JOB,
  ARTWORK_EXTRACT_JOB,
  LOUDNESS_JOB,
  ANALYTICS_ROLLUP_JOB,
} from '@soundcloud-clone/shared';

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: ConnectionOptions;

  constructor(private config: QueueConfig) {
    this.connection = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    };
  }

  /**
   * Initialize all queues
   */
  initializeQueues(): void {
    const queueNames = [
      TRANSCODE_JOB,
      WAVEFORM_JOB,
      ARTWORK_EXTRACT_JOB,
      LOUDNESS_JOB,
      ANALYTICS_ROLLUP_JOB,
    ];

    for (const name of queueNames) {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: this.config.retries.attempts,
          backoff: this.config.retries.backoff,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      });

      this.queues.set(name, queue);
    }

    console.log(`Initialized ${queueNames.length} queues`);
  }

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Register a worker for a queue
   */
  registerWorker(name: string, worker: Worker): void {
    this.workers.set(name, worker);
    console.log(`Registered worker for queue: ${name}`);
  }

  /**
   * Close all queues and workers
   */
  async close(): Promise<void> {
    console.log('Closing all workers...');
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    console.log('Closing all queues...');
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    console.log('Queue manager closed');
  }
}
