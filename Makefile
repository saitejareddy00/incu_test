# Root-level orchestration for the Salary Management System.
#
# Usage: `make` (prints help) · `make <target>` (runs a target).
# All targets are POSIX-shell based; on Windows use WSL or run the
# underlying npm scripts in `backend/` and `frontend/` directly.

SHELL := /bin/bash

BACKEND  := backend
FRONTEND := frontend

# ---------------------------------------------------------------------------
# Help (default)
# ---------------------------------------------------------------------------

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@printf "\nSalary Management System — make targets\n\n"
	@awk 'BEGIN { FS = ":.*##" } /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@printf "\n"

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

.PHONY: install
install: ## Install backend + frontend dependencies
	cd $(BACKEND)  && npm install
	cd $(FRONTEND) && npm install

# ---------------------------------------------------------------------------
# Database lifecycle
# ---------------------------------------------------------------------------

.PHONY: db-up
db-up: ## Start PostgreSQL via docker compose
	docker compose up -d

.PHONY: db-down
db-down: ## Stop PostgreSQL (preserves volumes)
	docker compose down

.PHONY: db-reset
db-reset: ## Stop PostgreSQL and wipe its volumes (destructive)
	docker compose down -v

.PHONY: migrate
migrate: ## Apply pending migrations to the dev database
	cd $(BACKEND) && npm run migrate

.PHONY: seed
seed: ## Seed 10,000 employees (truncates first)
	cd $(BACKEND) && npm run seed -- --truncate

# ---------------------------------------------------------------------------
# Dev servers (concurrent)
# ---------------------------------------------------------------------------

.PHONY: dev
dev: ## Run backend (:3000) and frontend (:5173) concurrently; Ctrl-C stops both
	@trap 'kill 0' EXIT INT TERM; \
	  ( cd $(BACKEND)  && npm run dev ) & \
	  ( cd $(FRONTEND) && npm run dev ) & \
	  wait

.PHONY: dev-backend
dev-backend: ## Run only the backend dev server
	cd $(BACKEND) && npm run dev

.PHONY: dev-frontend
dev-frontend: ## Run only the frontend dev server
	cd $(FRONTEND) && npm run dev

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

.PHONY: build
build: ## Production build for backend and frontend
	cd $(BACKEND)  && npm run build
	cd $(FRONTEND) && npm run build

# ---------------------------------------------------------------------------
# Test & lint (sequential; non-zero exit on any failure)
# ---------------------------------------------------------------------------

.PHONY: test
test: ## Run backend then frontend test suites
	cd $(BACKEND)  && npm test
	cd $(FRONTEND) && npm test

.PHONY: test-backend
test-backend: ## Run only the backend test suite
	cd $(BACKEND) && npm test

.PHONY: test-frontend
test-frontend: ## Run only the frontend test suite
	cd $(FRONTEND) && npm test

.PHONY: lint
lint: ## Lint backend and frontend
	cd $(BACKEND)  && npm run lint
	cd $(FRONTEND) && npm run lint

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

.PHONY: clean
clean: ## Remove build artefacts and installed dependencies
	rm -rf $(BACKEND)/dist $(BACKEND)/node_modules
	rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules
