# ═══════════════════════════════════════════════
# CampusEvents — Makefile
# ═══════════════════════════════════════════════

# Couleurs pour le help
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

.DEFAULT_GOAL := help

# ── Installation ─────────────────────────────

.PHONY: setup
setup: ## 🎓 Installation complète (1ère fois après clone)
	@test -f .env || (cp .env.example .env && echo "✅ .env créé depuis .env.example")
	docker compose up -d --build
	@echo "⏳ Attente que la DB soit prête..."
	@sleep 5
	docker compose run --rm --build seed
	@echo ""
	@echo "🎉 CampusEvents est prêt !"
	@echo "   Frontend : http://app.localhost"
	@echo "   API :      http://api.localhost"
	@echo "   Swagger :  http://api.localhost/api/docs"
	@echo ""
	@echo "   Admin : admin@campus.fr / admin123"
	@echo "   User  : alice@campus.fr / user123"

# ── Production ────────────────────────────────

.PHONY: up
up: ## Lancer l'application (production)
	docker compose up -d --build

.PHONY: down
down: ## Arrêter tous les services
	docker compose down

.PHONY: restart
restart: down up ## Redémarrer tous les services

# ── Développement ─────────────────────────────

.PHONY: dev
dev: ## Lancer en mode développement (hot-reload)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

.PHONY: dev-down
dev-down: ## Arrêter le mode développement
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# ── Base de données ───────────────────────────

.PHONY: migrate
migrate: ## Exécuter les migrations Prisma
	docker compose run --rm --build migrate

.PHONY: seed
seed: ## Charger les données de test
	docker compose run --rm --build seed

.PHONY: db-shell
db-shell: ## Ouvrir un shell PostgreSQL (ex. \dt pour les tables, SELECT * FROM "User";)
	docker compose exec db psql -U campus -d campusevents

.PHONY: db-reset
db-reset: ## Reset complet de la DB (volumes supprimés)
	docker compose down -v
	$(MAKE) up
	sleep 5
	$(MAKE) migrate
	$(MAKE) seed

# ── Logs & Debug ──────────────────────────────

.PHONY: logs
logs: ## Voir les logs de tous les services
	docker compose logs -f

.PHONY: logs-back
logs-back: ## Logs du backend uniquement
	docker compose logs -f backend

.PHONY: logs-front
logs-front: ## Logs du frontend uniquement
	docker compose logs -f frontend

.PHONY: logs-worker
logs-worker: ## Logs du worker uniquement
	docker compose logs -f worker

.PHONY: ps
ps: ## État des services
	docker compose ps

.PHONY: health
health: ## Vérifier les healthchecks
	@echo "$(YELLOW)── Healthchecks ──$(RESET)"
	@docker inspect campus-db --format='DB:       {{.State.Health.Status}}' 2>/dev/null || echo "DB:       not running"
	@docker inspect campus-redis --format='Redis:    {{.State.Health.Status}}' 2>/dev/null || echo "Redis:    not running"
	@docker inspect campus-backend --format='Backend:  {{.State.Health.Status}}' 2>/dev/null || echo "Backend:  not running"

# ── Nettoyage ─────────────────────────────────

.PHONY: clean
clean: ## Supprimer les conteneurs, réseaux et volumes
	docker compose down -v --remove-orphans
	docker system prune -f

# ── Scénario de panne ─────────────────────────

.PHONY: test
test: ## 🧪 Lancer les tests unitaires
	docker compose run --rm --build -e JWT_SECRET=dev-secret backend npm test

# ── Panne Redis ──────────────────────────────

.PHONY: chaos-redis
chaos-redis: ## Simuler une panne Redis
	@echo "$(YELLOW)Arrêt de Redis...$(RESET)"
	docker compose stop redis
	@echo "$(YELLOW)Redis arrêté. Observez les logs :$(RESET)"
	@echo "  make logs-back"
	@echo "  make logs-worker"
	@echo "$(YELLOW)Pour relancer : docker compose start redis$(RESET)"

# ── Help ──────────────────────────────────────

.PHONY: help
help: ## Afficher cette aide
	@echo "$(GREEN)═══ CampusEvents ═══$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""