COMPOSE=docker-compose
COMPOSE_FILE=infra/docker-compose.yml

.PHONY: infra-up infra-down infra-logs frontend-dev backend-dev backend-seed

infra-up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

infra-down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

infra-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

frontend-dev:
	pnpm dev

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-seed:
	cd backend && ./.venv/bin/python -m app.seed
