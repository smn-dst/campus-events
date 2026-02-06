const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Worker started (Redis:', REDIS_URL, ')');
// Garde le processus actif (à remplacer par BullMQ)
setInterval(() => {}, 60000);