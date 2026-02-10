import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'registration-notifications';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { userName, userEmail, eventTitle, eventDate, eventLocation } = job.data;
    console.log(`Notification: ${userName} <${userEmail}> → ${eventTitle} (${eventDate}) @ ${eventLocation}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { sent: true, to: userEmail };
  },
  { connection, concurrency: 5 }
);

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} done → ${result.to}`);
});
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
worker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

async function shutdown() {
  await worker.close();
  await connection.quit();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
