// ═══════════════════════════════════════════════
// Script de seed pour créer des événements de test
// Usage: node prisma/seed.js
// ═══════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Créer un admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.fr' },
    update: {},
    create: {
      email: 'admin@campus.fr',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Campus',
      role: 'admin',
    },
  });

  console.log('✅ Admin créé:', admin.email);

  // 2. Créer des utilisateurs de test
  const alice = await prisma.user.upsert({
    where: { email: 'alice@campus.fr' },
    update: {},
    create: {
      email: 'alice@campus.fr',
      password: await bcrypt.hash('user123', 10),
      firstName: 'Alice',
      lastName: 'Martin',
      role: 'user',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@campus.fr' },
    update: {},
    create: {
      email: 'bob@campus.fr',
      password: await bcrypt.hash('user123', 10),
      firstName: 'Bob',
      lastName: 'Dupont',
      role: 'user',
    },
  });

  console.log('✅ Utilisateurs créés:', alice.email, bob.email);

  // 3. Créer des événements variés
  const events = [
    {
      title: 'Hackathon IA 2026',
      description: 'Concours de programmation IA sur 48h. Challenges innovants, mentorat, et prix à gagner !',
      location: 'Amphithéâtre A - Campus Paris',
      tags: ['tech', 'competition', 'innovation'],
      capacity: 50,
      startAt: new Date('2026-03-15T09:00:00Z'),
      endAt: new Date('2026-03-17T18:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Soirée BDE - Thème années 80',
      description: 'Grande soirée dansante organisée par le BDE. Dress code obligatoire !',
      location: 'Salle des fêtes - Campus Lyon',
      tags: ['soiree', 'culture', 'social'],
      capacity: 200,
      startAt: new Date('2026-02-20T20:00:00Z'),
      endAt: new Date('2026-02-21T02:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Tournoi de Football Inter-Campus',
      description: 'Championnat inter-campus. Inscriptions par équipe de 7 joueurs.',
      location: 'Stade universitaire - Campus Marseille',
      tags: ['sport', 'competition'],
      capacity: 100,
      startAt: new Date('2026-04-10T14:00:00Z'),
      endAt: new Date('2026-04-10T19:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Conférence Startups & Entrepreneuriat',
      description: 'Rencontre avec des fondateurs de startups à succès. Session Q&A et networking.',
      location: 'Salle de conférence - Campus Lille',
      tags: ['entrepreneuriat', 'networking', 'carriere'],
      capacity: 80,
      startAt: new Date('2026-03-05T18:00:00Z'),
      endAt: new Date('2026-03-05T21:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Atelier Développement Durable',
      description: 'Workshop pratique sur la réduction de l\'empreinte carbone. Activités manuelles et sensibilisation.',
      location: 'Espace écologique - Campus Bordeaux',
      tags: ['ecologie', 'atelier', 'social'],
      capacity: 30,
      startAt: new Date('2026-02-25T14:00:00Z'),
      endAt: new Date('2026-02-25T17:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Concert Live - Groupe émergent',
      description: 'Concert acoustique d\'un groupe local prometteur. Ambiance intimiste garantie.',
      location: 'Cafétéria Campus - Campus Toulouse',
      tags: ['musique', 'culture', 'soiree'],
      capacity: 120,
      startAt: new Date('2026-03-12T19:00:00Z'),
      endAt: new Date('2026-03-12T22:00:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Séance de Yoga en plein air',
      description: 'Cours de yoga gratuit ouvert à tous les niveaux. Apportez votre tapis !',
      location: 'Pelouse centrale - Campus Nice',
      tags: ['sport', 'bien-etre'],
      capacity: 40,
      startAt: new Date('2026-02-18T08:00:00Z'),
      endAt: new Date('2026-02-18T09:30:00Z'),
      createdById: admin.id,
    },
    {
      title: 'Job Dating - Entreprises Tech',
      description: 'Rencontrez 20+ entreprises tech pour des stages et CDI. CV obligatoire.',
      location: 'Hall principal - Campus Nantes',
      tags: ['carriere', 'networking', 'tech'],
      capacity: 150,
      startAt: new Date('2026-04-08T10:00:00Z'),
      endAt: new Date('2026-04-08T17:00:00Z'),
      createdById: admin.id,
    },
  ];

  const createdEvents = [];
  for (const eventData of events) {
    const event = await prisma.event.create({ data: eventData });
    createdEvents.push(event);
    console.log(`✅ Événement créé: ${eventData.title}`);
  }

  // 4. Créer quelques inscriptions (uniquement sur les événements qu'on vient de créer)
  // Alice s'inscrit aux 3 premiers
  for (let i = 0; i < 3 && i < createdEvents.length; i++) {
    await prisma.registration.create({
      data: {
        userId: alice.id,
        eventId: createdEvents[i].id,
      },
    });
    console.log(`✅ Inscription: ${alice.firstName} → ${createdEvents[i].title}`);
  }

  // Bob s'inscrit aux événements sportifs (parmi ceux créés ce run)
  const sportEvents = createdEvents.filter(e => e.tags.includes('sport'));
  for (const event of sportEvents) {
    await prisma.registration.create({
      data: {
        userId: bob.id,
        eventId: event.id,
      },
    });
    console.log(`✅ Inscription: ${bob.firstName} → ${event.title}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
