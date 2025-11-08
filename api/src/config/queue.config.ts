import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_ATTEMPTS || '3', 10),
    backoff: {
      type: 'exponential' as const,
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '1000', 10),
    },
    removeOnComplete: process.env.QUEUE_REMOVE_ON_COMPLETE === 'true' || true,
    removeOnFail: process.env.QUEUE_REMOVE_ON_FAIL === 'true' || false,
  },
}));
