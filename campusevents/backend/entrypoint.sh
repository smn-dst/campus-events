#!/bin/sh

set -e

echo "⏳ Exécution des migrations Prisma..."
npx prisma migrate deploy

echo "✅ Migrations terminées"
echo "🚀 Démarrage du serveur..."

exec node src/index.js
