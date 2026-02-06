# 🎓 CampusEvents

Application de gestion d'événements campus — Front + Back conteneurisée avec Docker Compose.

## Stack technique

| Service     | Technologie              | Rôle                          |
|-------------|--------------------------|-------------------------------|
| Frontend    | Vue 3 + Vite             | Interface utilisateur         |
| Backend     | Express.js + Prisma      | API REST + Auth JWT           |
| Base de données | PostgreSQL 16        | Stockage des données          |
| Cache/Queue | Redis 7                  | Cache + file de jobs BullMQ   |
| Proxy       | Nginx                    | Reverse proxy                 |
| Worker      | Node.js + BullMQ         | Jobs asynchrones              |

## Lancement rapide

```bash
# 1. Cloner le dépôt
git clone <url> && cd campusevents

# 2. Copier et configurer les variables d'environnement
cp .env.example .env

# 3. Lancer l'application
make up

# 4. Exécuter les migrations
make migrate

# 5. Charger les données de test
make seed

# 6. Ouvrir dans le navigateur
#    Frontend : http://app.localhost
#    API :      http://api.localhost
#    Swagger :  http://api.localhost/api/docs
```

## Commandes disponibles

```bash
make help        # Voir toutes les commandes
make up          # Lancer en production
make dev         # Lancer en développement (hot-reload)
make migrate     # Migrations DB
make seed        # Données de test
make logs        # Voir les logs
make health      # Vérifier les healthchecks
make chaos-redis # Simuler une panne Redis
make down        # Tout arrêter
```

## Architecture

Voir le schéma dans `docs/architecture.html` ou ci-dessous :

```
Client (navigateur)
      │
      ▼ HTTP :80
┌─────────────────────────────────────────────┐
│  Nginx (reverse proxy)                       │
│  ├── app.localhost → Frontend Vue 3          │
│  └── api.localhost → Backend Express         │
├─────────────────────────────────────────────┤
│  Réseau PUBLIC : proxy_net                   │
└──────┬──────────────────┬───────────────────┘
       │                  │
       ▼                  ▼
  ┌──────────┐    ┌──────────────┐
  │ Frontend │    │ Backend API  │──┐
  │ Vue 3    │    │ Express.js   │  │
  └──────────┘    └──────┬───────┘  │
                         │          │
              ┌──────────┴──────────┤
              │  Réseau PRIVÉ :     │
              │  backend_net        │
              ├──────────┬──────────┤
              ▼          ▼          ▼
        ┌──────────┐ ┌───────┐ ┌────────┐
        │PostgreSQL│ │ Redis │ │ Worker │
        │ (pg_data)│ │       │ │ BullMQ │
        └──────────┘ └───────┘ └────────┘
```

## Comptes de test (après seed)

| Email               | Mot de passe | Rôle  |
|---------------------|-------------|-------|
| admin@campus.fr     | admin123    | admin |
| alice@campus.fr     | user123     | user  |
| bob@campus.fr       | user123     | user  |

## Scénario de test — Panne Redis

```bash
# 1. Vérifier que tout fonctionne
make health

# 2. S'inscrire à un événement via l'interface

# 3. Couper Redis
make chaos-redis

# 4. Observer les erreurs dans les logs
make logs-back
make logs-worker

# 5. Relancer Redis
docker compose start redis

# 6. Le worker reprend le traitement automatiquement
make logs-worker
```

## Variables d'environnement

Voir `.env.example` pour la liste complète.

## Endpoints API principaux

| Méthode | Route                     | Description              | Auth    |
|---------|---------------------------|--------------------------|---------|
| POST    | /api/auth/register        | Inscription              | —       |
| POST    | /api/auth/login           | Connexion                | —       |
| GET     | /api/events               | Liste des événements     | —       |
| GET     | /api/events/:id           | Détail d'un événement    | —       |
| POST    | /api/events               | Créer un événement       | Admin   |
| PUT     | /api/events/:id           | Modifier un événement    | Admin   |
| DELETE  | /api/events/:id           | Supprimer un événement   | Admin   |
| POST    | /api/events/:id/register  | S'inscrire               | User    |
| DELETE  | /api/events/:id/register  | Se désinscrire           | User    |
| GET     | /api/events/:id/attendees | Liste des inscrits       | User    |
| GET     | /health                   | Healthcheck              | —       |
