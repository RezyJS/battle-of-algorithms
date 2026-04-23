# Battle of Algorithms

Проект состоит из:

- frontend на `Next.js`;
- backend на `FastAPI`;
- `PostgreSQL` для данных приложения;
- `Keycloak` для auth и ролей.

## Dev порты

- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`
- backend docs: `http://localhost:8000/docs`
- keycloak: `http://localhost:8080`
- postgres: `localhost:5432`

## Что установить

- `Node.js 20+`
- `pnpm`
- `Python 3.14+`
- `uv` или `pip`
- `Docker Desktop`
- `docker-compose`

## Подготовка env

Frontend:

```bash
cp .env.local.example .env.local
```

Backend:

```bash
cp backend/.env.example backend/.env
```

Docker Compose:

```bash
cp infra/postgres.env.example infra/postgres.env
cp infra/keycloak.env.example infra/keycloak.env
cp infra/backend.env.example infra/backend.env
cp infra/frontend.env.example infra/frontend.env
```

## Запуск инфраструктуры

Перед запуском убедись, что `Docker Desktop` открыт и docker daemon запущен.

Если нужно поднять контейнерное окружение одной командой:

```bash
make dev
```

Эта команда поднимет `postgres`, `keycloak`, `backend` и `frontend` через `docker-compose`.

Если хочешь запускать только контейнеры:

```bash
make infra-up
```

Или без `make`:

```bash
docker-compose -f infra/docker-compose.yml up -d
```

Локальные учётные данные и секреты теперь задаются только через `infra/*.env`.

Тестовые пользователи Keycloak:

- `dev-user` / `DevPass123!`
- `dev-moderator` / `DevPass123!`
- `dev-admin` / `DevPass123!`

## Запуск frontend

```bash
pnpm dev
```

## Запуск backend

Через `uv`:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Через `venv` и `pip`:

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Seed локальных данных

После миграций можно заполнить БД тестовыми данными:

```bash
make backend-seed
```

Что создаётся:

- `seed-moderator`
- `seed-alice`
- `seed-bob`
- по одной `approved` отправке для `seed-alice` и `seed-bob`
- активный бой `Seed Alice vs Seed Bob`

## Backend структура

```text
backend/
  app/
    api/
    main.py
    config.py
  alembic/
  pyproject.toml
```

## Что уже подготовлено на этапе 0

- `infra/docker-compose.yml`
- `.env.local.example`
- `backend/.env.example`
- backend-скелет на `FastAPI`
- `Makefile` с базовыми командами
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

## Следующий ручной шаг

После первого запуска контейнеров нужно в Keycloak создать:

- realm `battle-of-algorithms`
- clients `frontend` и `backend`
- roles `user`, `moderator`, `admin`
- тестовых пользователей под все роли
