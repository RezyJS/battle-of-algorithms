# Battle of Algorithms

## Что это

`Battle of Algorithms` — веб-платформа, где пользователи пишут JS-алгоритмы для навигации по лабиринту и смотрят бои.

Основные сценарии:

- публичная арена с активным боем и просмотром симуляции;
- приватные одноразовые комнаты, где два игрока договариваются о карте, загружают код, подтверждают готовность и смотрят результат.

## Текущий стек

### Frontend

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Zustand`
- `CodeMirror`

### Backend

- `FastAPI`
- `SQLAlchemy 2`
- `Alembic`
- `PostgreSQL`
- `psycopg`

### Auth и инфраструктура

- `Keycloak` по `OIDC`
- `Caddy`
- `Docker Compose`:
  - `postgres`
  - `keycloak`
  - `backend`
  - `frontend`

## Основные пользовательские сценарии

### 1. Арена

- просмотр текущего активного боя;
- запуск, пауза, перемотка и сброс симуляции;
- отображение результата и лога событий.

### 2. Редактор

- написание алгоритма на JavaScript;
- сохранение черновика;
- отправка решения на модерацию;
- просмотр статуса последней отправки.

### 3. Приватные бои

- создание комнаты по `username` соперника;
- случайная генерация карты на backend;
- подтверждение кода каждым игроком отдельно;
- запрос на смену карты только по согласию обоих игроков;
- подтверждение готовности;
- один бой на одну комнату;
- после старта боя комната становится read-only;
- результат сохраняется в БД.

### 4. Модерация

- просмотр всех отправок;
- смена статуса отправки;
- выбор состава арены из одобренных решений.

## Архитектура

### Frontend

Frontend в корне репозитория:

- `app/` — маршруты Next.js;
- `src/features/` — пользовательские сценарии;
- `src/widgets/` — крупные UI-блоки;
- `src/entities/` — игровые сущности и поле;
- `src/shared/` — auth, api helpers, общие UI и утилиты.

Симуляция выполняется на фронтенде.

### Backend

Backend в `backend/` отвечает за:

- синхронизацию пользователей из Keycloak;
- хранение отправок кода;
- модерацию;
- активный публичный бой;
- приватные комнаты, готовность, карту и результат.

## Авторизация

- браузер уходит в `Keycloak`;
- после callback фронтенд валидирует `state`, меняет `code` на токены и синхронизирует профиль в backend;
- локальная серверная сессия хранится в `httpOnly` cookie `boa_session`;
- роли берутся из `realm_access.roles`.

## Production-схема

- `https://boa.rezyjs.ru` — приложение;
- `https://auth.boa.rezyjs.ru` — Keycloak;
- `Caddy` проксирует трафик на контейнеры;
- контейнеры поднимаются через `docker compose -f infra/docker-compose.yml up -d --build`.

## Где смотреть дальше

- [PROJECT_SUMMARY.md](/Users/rezyjs/Development/battle-of-algorithms/docs/PROJECT_SUMMARY.md) — более структурированная сводка;
- [ALGORITHMS.md](/Users/rezyjs/Development/battle-of-algorithms/docs/ALGORITHMS.md) — детали игровой логики и генерации карт;
- [DOCKER_OPERATIONS_RUNBOOK.md](/Users/rezyjs/Development/battle-of-algorithms/docs/DOCKER_OPERATIONS_RUNBOOK.md) — команды для сервера.
