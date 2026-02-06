// ═══════════════════════════════════════════════
// Queue BullMQ — File de jobs partagée
//
// Côté API  : on importe `registrationQueue` pour ajouter des jobs
// Côté Worker : on importe `QUEUE_NAME` + la connexion Redis
// ═══════════════════════════════════════════════

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Connexion Redis réutilisable
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // requis par BullMQ
});

export const QUEUE_NAME = 'registration-notifications';

// La queue utilisée par l'API pour ajouter des jobs
export const registrationQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});
