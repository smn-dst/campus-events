-- ═══════════════════════════════════════════════
-- Migration: complete_schema
-- Ajout des champs manquants + table Registration
-- ═══════════════════════════════════════════════

-- AlterTable User : ajout firstName et lastName
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- AlterTable Event : ajout location, tags, capacity, createdById
ALTER TABLE "Event" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Event" ADD COLUMN "capacity" INT NOT NULL DEFAULT 50;
ALTER TABLE "Event" ADD COLUMN "createdById" TEXT;

-- CreateTable Registration
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex : un user ne peut s'inscrire qu'une fois par event
CREATE UNIQUE INDEX "Registration_userId_eventId_key" ON "Registration"("userId", "eventId");

-- AddForeignKey : Event.createdById → User.id
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey : Registration.userId → User.id (CASCADE)
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey : Registration.eventId → Event.id (CASCADE)
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
