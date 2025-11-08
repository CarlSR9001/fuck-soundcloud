/**
 * Health check service
 * Provides HTTP endpoint for container health monitoring
 */

import http from 'http';
import { QueueManager } from '../queue/queue-manager';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  queues: {
    [key: string]: {
      connected: boolean;
    };
  };
}

export class HealthCheckService {
  private server: http.Server | null = null;

  constructor(
    private queueManager: QueueManager,
    private port: number = 3001
  ) {}

  /**
   * Start health check HTTP server
   */
  start(): void {
    this.server = http.createServer(async (req, res) => {
      if (req.url === '/health') {
        const health = await this.getHealthStatus();
        res.writeHead(health.status === 'healthy' ? 200 : 503, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(health, null, 2));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`Health check server listening on port ${this.port}`);
    });
  }

  /**
   * Get current health status
   */
  private async getHealthStatus(): Promise<HealthStatus> {
    const queues: HealthStatus['queues'] = {};
    let allHealthy = true;

    try {
      // Check all registered queues
      const queueNames = [
        'transcode',
        'waveform',
        'artwork-extract',
        'loudness',
        'analytics-rollup',
        'fingerprint',
        'distribution',
      ];

      for (const queueName of queueNames) {
        const queue = this.queueManager.getQueue(queueName);

        if (queue) {
          try {
            // Test Redis connection by trying to get queue stats
            await queue.getJobCounts();
            queues[queueName] = { connected: true };
          } catch (error) {
            queues[queueName] = { connected: false };
            allHealthy = false;
          }
        } else {
          queues[queueName] = { connected: false };
          allHealthy = false;
        }
      }
    } catch (error) {
      allHealthy = false;
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queues,
    };
  }

  /**
   * Stop health check server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Health check server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
