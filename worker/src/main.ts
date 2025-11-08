/**
 * Worker service entry point
 * Initializes queues, registers workers, and starts health check
 */

import { loadQueueConfig } from './config/queue.config';
import { loadStorageConfig } from './config/storage.config';
import { loadDatabaseConfig } from './config/database.config';
import { QueueManager } from './queue/queue-manager';
import { WorkerRegistry } from './queue/worker-registry';
import { HealthCheckService } from './health/health-check';

async function bootstrap() {
  console.log('Starting worker service...');

  // Load configuration
  const queueConfig = loadQueueConfig();
  const storageConfig = loadStorageConfig();
  const databaseConfig = loadDatabaseConfig();

  console.log('Configuration loaded');
  console.log(`Redis: ${queueConfig.redis.host}:${queueConfig.redis.port}`);
  console.log(`MinIO: ${storageConfig.endpoint}:${storageConfig.port}`);
  console.log(`Database: ${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);

  // Initialize queue manager
  const queueManager = new QueueManager(queueConfig);
  queueManager.initializeQueues();

  // Register all workers
  const workerRegistry = new WorkerRegistry(queueManager, queueConfig);
  workerRegistry.registerAllWorkers();

  // Start health check service
  const healthPort = parseInt(process.env.HEALTH_PORT || '3001', 10);
  const healthCheck = new HealthCheckService(queueManager, healthPort);
  healthCheck.start();

  console.log('Worker service started successfully');

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);

    try {
      await healthCheck.stop();
      await queueManager.close();
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the worker service
bootstrap().catch((error) => {
  console.error('Failed to start worker service:', error);
  process.exit(1);
});
