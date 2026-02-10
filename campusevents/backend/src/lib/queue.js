import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAME = 'registration-notifications';
export const registrationQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});
