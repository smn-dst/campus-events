// ═══════════════════════════════════════════════
// Worker BullMQ — Traitement des notifications
//
// Ce processus tourne dans un conteneur séparé.
// Il écoute la file Redis "registration-notifications"
// et traite chaque job (ici : log en console simulant
// l'envoi d'un email de confirmation).
//
// Lancé par : docker compose (service "worker")
// Commande  : node src/worker.js
// ═══════════════════════════════════════════════

import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'registration-notifications';

// Connexion Redis dédiée au worker
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log('═══════════════════════════════════════════');
console.log('🔧 Worker démarré');
console.log(`   Queue  : ${QUEUE_NAME}`);
console.log(`   Redis  : ${REDIS_URL}`);
console.log('   En attente de jobs...');
console.log('═══════════════════════════════════════════');

// ── Créer le worker ─────────────────────────
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { userName, userEmail, eventTitle, eventDate, eventLocation } = job.data;

    console.log('');
    console.log('📧 ── Notification d\'inscription ──────────');
    console.log(`   Job ID   : ${job.id}`);
    console.log(`   À        : ${userName} <${userEmail}>`);
    console.log(`   Événement: ${eventTitle}`);
    console.log(`   Date     : ${eventDate}`);
    console.log(`   Lieu     : ${eventLocation}`);
    console.log('   Status   : ✅ Email de confirmation envoyé (simulé)');
    console.log('──────────────────────────────────────────');

    // Simuler un délai d'envoi d'email (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    return { sent: true, to: userEmail };
  },
  {
    connection,
    concurrency: 5, // Traite jusqu'à 5 jobs en parallèle
  }
);

// ── Événements du worker ────────────────────
worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} terminé — email envoyé à ${result.to}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} échoué:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Erreur worker:', err.message);
});

// ── Graceful shutdown ───────────────────────
process.on('SIGTERM', async () => {
  console.log('⏹️  Worker: arrêt en cours...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  Worker: arrêt en cours...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});
