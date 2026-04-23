# Battle of Algorithms

`Battle of Algorithms` — веб-платформа, где пользователи пишут JS-алгоритмы для прохождения лабиринта, отправляют решения на модерацию и запускают бои.

Основной стек:

- `frontend` — `Next.js 16`;
- `backend` — `FastAPI`;
- `database` — `PostgreSQL 16`;
- `auth` — `Keycloak`;
- `reverse proxy` — `Caddy`;
- `orchestration` — `Docker Compose`.

## Архитектура

Продовая схема рассчитана на один VPS:

- `Caddy` принимает внешний HTTPS-трафик;
- `frontend` отвечает за UI и OIDC-flow;
- `backend` отдаёт API;
- `Keycloak` хранит пользователей, роли и login/register flow;
- `PostgreSQL` хранит данные приложения и отдельную БД Keycloak.

Типовая схема доменов:

- `https://app.example.com` — frontend;
- `https://auth.example.com` — Keycloak.

Внутри docker-сети сервисы общаются так:

- `frontend -> backend` по `http://backend:8000`;
- `frontend -> keycloak` по `http://keycloak:8080` для внутреннего обмена токеном;
- браузер пользователя ходит в Keycloak только через внешний домен `https://auth.example.com`.

## Репозиторий

- `app/`, `src/` — frontend;
- `backend/` — API, модели, миграции;
- `infra/` — `docker-compose`, env-файлы и init-скрипты для Postgres;
- `docs/` — дополнительные runbook- и проектные заметки.

## Что нужно на сервере

Минимум:

- установленный `docker`;
- установленный `docker compose`;
- настроенный `Caddy`;
- DNS-записи доменов, указывающие на VPS;
- склонированный репозиторий.

Если репозиторий уже на сервере, отдельные `Node.js`, `pnpm`, `Python` для продового запуска не нужны: frontend и backend собираются в контейнерах.

## Порты контейнеров

По умолчанию `docker-compose` публикует:

- `frontend` — `3000`;
- `backend` — `8000`;
- `keycloak` — `8080`;
- `postgres` — `5432`.

Если `Caddy` и контейнеры находятся на одном VPS, наружу обычно достаточно проксировать:

- `127.0.0.1:3000` -> frontend;
- `127.0.0.1:8080` -> keycloak.

## Первый запуск на VPS с нуля

Ниже порядок, в котором это действительно удобно поднимать.

### 1. Перейти в репозиторий

```bash
cd /path/to/battle-of-algorithms
```

### 2. Создать env-файлы

```bash
cp infra/postgres.env.example infra/postgres.env
cp infra/keycloak.env.example infra/keycloak.env
cp infra/backend.env.example infra/backend.env
cp infra/frontend.env.example infra/frontend.env
```

### 3. Заполнить `infra/postgres.env`

Пример:

```env
POSTGRES_DB=battle_of_algorithms
POSTGRES_USER=boa
POSTGRES_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD
```

Тут нужен один сильный пароль. Он используется:

- для основной БД приложения;
- для доступа Keycloak к своей БД на том же PostgreSQL.

### 4. Заполнить `infra/keycloak.env`

Пример для прода:

```env
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
KC_DB_USERNAME=boa
KC_DB_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD
KC_HOSTNAME=auth.example.com
KC_HTTP_ENABLED=true
KC_PROXY_HEADERS=xforwarded
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=CHANGE_ME_STRONG_KEYCLOAK_ADMIN_PASSWORD
```

Что важно:

- `KC_HOSTNAME` должен быть равен внешнему домену Keycloak;
- `KC_DB_PASSWORD` должен совпадать с `POSTGRES_PASSWORD`;
- bootstrap admin нужен только для первого входа в админку Keycloak.

### 5. Сначала поднять только Postgres и Keycloak

```bash
docker compose -f infra/docker-compose.yml up -d postgres keycloak
```

Проверить, что контейнеры живы:

```bash
docker compose -f infra/docker-compose.yml ps
```

### 6. Прописать проксирование в Caddy

Пример `Caddyfile` для двух доменов:

```caddy
app.example.com {
	reverse_proxy 127.0.0.1:3000
}

auth.example.com {
	reverse_proxy 127.0.0.1:8080
}
```

После изменения применить конфиг так, как у тебя уже заведено для Caddy, например:

```bash
sudo systemctl reload caddy
```

### 7. Первый вход в Keycloak

Открой:

```text
https://auth.example.com
```

Войди bootstrap-админом:

- username: значение `KC_BOOTSTRAP_ADMIN_USERNAME`;
- password: значение `KC_BOOTSTRAP_ADMIN_PASSWORD`.

### 8. Создать realm, roles, clients и пользователей в Keycloak

Нужно создать:

- realm: `battle-of-algorithms`;
- realm roles: `user`, `moderator`, `admin`;
- client `frontend`;
- client `backend`;
- пользователей и назначить им нужные realm roles.

#### Client `frontend`

Рекомендуемые параметры:

- Client ID: `frontend`
- Client authentication: `ON`
- Authorization: `OFF`
- Standard flow: `ON`
- Direct access grants: `OFF`
- Root URL: `https://app.example.com`
- Home URL: `https://app.example.com`
- Valid redirect URIs: `https://app.example.com/api/auth/callback`
- Valid post logout redirect URIs: `https://app.example.com`
- Web origins: `https://app.example.com`

После создания клиента сохрани его secret: он пойдёт в `infra/frontend.env`.

#### Client `backend`

Рекомендуемые параметры:

- Client ID: `backend`
- Client authentication: `ON`
- Authorization: `OFF`
- Standard flow: `OFF`
- Service accounts roles: `ON`

После создания клиента сохрани его secret: он пойдёт в `infra/backend.env`.

### 9. Заполнить `infra/backend.env`

Пример:

```env
APP_NAME=Battle of Algorithms API
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=postgresql+psycopg://boa:CHANGE_ME_STRONG_DB_PASSWORD@postgres:5432/battle_of_algorithms
KEYCLOAK_SERVER_URL=http://keycloak:8080
KEYCLOAK_REALM=battle-of-algorithms
KEYCLOAK_BACKEND_CLIENT_ID=backend
KEYCLOAK_BACKEND_CLIENT_SECRET=PASTE_BACKEND_CLIENT_SECRET
CORS_ALLOW_ORIGINS=https://app.example.com
INTERNAL_API_SECRET=CHANGE_ME_SHARED_INTERNAL_SECRET
```

Что важно:

- `DATABASE_URL` должен содержать тот же пароль, что и `infra/postgres.env`;
- `KEYCLOAK_SERVER_URL` оставляем внутренним: `http://keycloak:8080`;
- `KEYCLOAK_BACKEND_CLIENT_SECRET` вставляется из Keycloak;
- `CORS_ALLOW_ORIGINS` должен указывать на публичный frontend-домен;
- `INTERNAL_API_SECRET` придумай длинный случайный секрет и потом вставь его ещё и во frontend env.

### 10. Заполнить `infra/frontend.env`

Пример:

```env
NEXT_PUBLIC_API_URL=http://backend:8000
KEYCLOAK_ISSUER=https://auth.example.com/realms/battle-of-algorithms
KEYCLOAK_INTERNAL_ISSUER=http://keycloak:8080/realms/battle-of-algorithms
KEYCLOAK_CLIENT_ID=frontend
KEYCLOAK_CLIENT_SECRET=PASTE_FRONTEND_CLIENT_SECRET
APP_URL=https://app.example.com
SESSION_SECRET=CHANGE_ME_LONG_RANDOM_SESSION_SECRET
INTERNAL_API_SECRET=CHANGE_ME_SHARED_INTERNAL_SECRET
```

Что важно:

- `KEYCLOAK_ISSUER` — только внешний HTTPS URL Keycloak realm;
- `KEYCLOAK_INTERNAL_ISSUER` — внутренний docker URL;
- `KEYCLOAK_CLIENT_SECRET` — secret клиента `frontend`;
- `APP_URL` — внешний URL приложения;
- `SESSION_SECRET` — длинный случайный секрет;
- `INTERNAL_API_SECRET` должен совпадать со значением в `infra/backend.env`.

### 11. Собрать и поднять весь стек

```bash
make build
```

Эта команда:

- собирает `frontend` и `backend`;
- поднимает `postgres`, `keycloak`, `backend`, `frontend`.

### 12. Прогнать миграции БД

После первого запуска backend выполни:

```bash
make migrate
```

Если backend-контейнер ещё не успел стартовать, подожди несколько секунд и повтори.

### 13. Проверить сервисы

Локально на VPS:

```bash
curl -fsS http://127.0.0.1:8000/api/health
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8080
```

Снаружи:

- открой `https://app.example.com`;
- проверь login/register;
- проверь, что редирект уходит в `https://auth.example.com`;
- после логина проверь возврат обратно в `https://app.example.com`.

## В каком порядке реально запускать

Краткая версия без пояснений:

1. `cp infra/*.env.example -> infra/*.env`
2. заполнить `infra/postgres.env`
3. заполнить `infra/keycloak.env`
4. `docker compose -f infra/docker-compose.yml up -d postgres keycloak`
5. прописать `Caddyfile`
6. открыть Keycloak и создать realm/roles/clients/users
7. вставить client secrets в `infra/backend.env` и `infra/frontend.env`
8. заполнить домены и общие секреты в этих env
9. `make build`
10. `make migrate`
11. проверить логи и открыть сайт

## Что вводить и куда копировать

Из Keycloak в `infra/frontend.env`:

- secret клиента `frontend` -> `KEYCLOAK_CLIENT_SECRET`

Из Keycloak в `infra/backend.env`:

- secret клиента `backend` -> `KEYCLOAK_BACKEND_CLIENT_SECRET`

Один и тот же пароль:

- `infra/postgres.env:POSTGRES_PASSWORD`
- `infra/keycloak.env:KC_DB_PASSWORD`
- `infra/backend.env:DATABASE_URL`

Один и тот же внутренний секрет:

- `infra/backend.env:INTERNAL_API_SECRET`
- `infra/frontend.env:INTERNAL_API_SECRET`

Внешние домены:

- `infra/keycloak.env:KC_HOSTNAME=auth.example.com`
- `infra/frontend.env:APP_URL=https://app.example.com`
- `infra/frontend.env:KEYCLOAK_ISSUER=https://auth.example.com/realms/battle-of-algorithms`
- `infra/backend.env:CORS_ALLOW_ORIGINS=https://app.example.com`

## Как потом запускать всё одной командой

После того как env-файлы один раз настроены, обычный запуск:

```bash
make up
```

Если ты менял код и нужна пересборка образов:

```bash
make build
```

Полезные команды:

```bash
make ps
make logs
make down
make migrate
```

Подробный серверный runbook: [docs/DOCKER_OPERATIONS_RUNBOOK.md](docs/DOCKER_OPERATIONS_RUNBOOK.md)

## Локальная разработка

### Локальные env

Frontend:

```bash
cp .env.local.example .env.local
```

Backend:

```bash
cp backend/.env.example backend/.env
```

Контейнерные env:

```bash
cp infra/postgres.env.example infra/postgres.env
cp infra/keycloak.env.example infra/keycloak.env
cp infra/backend.env.example infra/backend.env
cp infra/frontend.env.example infra/frontend.env
```

### Поднять контейнеры

```bash
make build
```

Или только запустить уже собранные:

```bash
make up
```

### Frontend

```bash
pnpm dev
```

### Backend через `uv`

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Backend через `venv`

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Seed локальных данных

После миграций:

```bash
make backend-seed
```

Создаются:

- `dev-user`
- `dev-moderator`
- `dev-admin`
- набор тестовых отправок
- активный бой для локальной отладки
