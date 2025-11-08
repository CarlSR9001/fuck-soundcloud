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
    // TODO: Implement actual queue health checks
    // For now, return basic status
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queues: {},
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
