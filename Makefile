COMPOSE=docker-compose
COMPOSE_FILE=infra/docker-compose.yml
BACKEND_VENV=backend/.venv
BACKEND_UVICORN=$(BACKEND_VENV)/bin/uvicorn

.PHONY: infra-up infra-down infra-logs frontend-dev backend-dev backend-seed dev

infra-up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

infra-down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

infra-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

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
	$(COMPOSE) -f $(COMPOSE_FILE) up -d && \
	(if [ -x "$(BACKEND_UVICORN)" ]; then \
		cd backend && ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; \
	elif command -v uv >/dev/null 2>&1; then \
		cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; \
	else \
		echo "Backend dependencies are not installed. Create backend/.venv or install uv."; \
		exit 1; \
	fi) & \
	BACKEND_PID=$$!; \
	pnpm dev & \
	FRONTEND_PID=$$!; \
	trap 'kill $$BACKEND_PID $$FRONTEND_PID' INT TERM EXIT; \
	wait $$BACKEND_PID $$FRONTEND_PID
