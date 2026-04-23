COMPOSE=docker compose
COMPOSE_FILE=infra/docker-compose.yml
BACKEND_VENV=backend/.venv
BACKEND_UVICORN=$(BACKEND_VENV)/bin/uvicorn

.PHONY: up down logs build restart infra-up infra-down infra-logs frontend-dev backend-dev backend-seed dev

up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

build:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

restart:
	$(COMPOSE) -f $(COMPOSE_FILE) down
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

# Backward-compatible aliases for the old naming.
infra-up: up

infra-down: down

infra-logs: logs

frontend-dev:
	pnpm dev

backend-dev:
	@if [ -x "$(BACKEND_UVICORN)" ]; then \
		cd backend && ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; \
	elif command -v uv >/dev/null 2>&1; then \
		cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; \
	else \
		echo "Backend dependencies are not installed. Create backend/.venv or install uv."; \
		exit 1; \
	fi

backend-seed:
	cd backend && ./.venv/bin/python -m app.seed

dev:
	$(MAKE) build
