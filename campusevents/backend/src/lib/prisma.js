// ═══════════════════════════════════════════════
// Client Prisma — Singleton
// On réutilise la même instance partout pour
// éviter de créer trop de connexions à la DB.
// ═══════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
