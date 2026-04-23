# Docker Operations Runbook

Короткий набор команд для сервера.

## Первый запуск

```bash
cp infra/postgres.env.example infra/postgres.env
cp infra/keycloak.env.example infra/keycloak.env
cp infra/backend.env.example infra/backend.env
cp infra/frontend.env.example infra/frontend.env
```

1. Заполни `infra/postgres.env` и `infra/keycloak.env`.
2. Подними базу и Keycloak:

```bash
docker compose -f infra/docker-compose.yml up -d postgres keycloak
```

3. Настрой realm, clients, roles и пользователей в Keycloak.
4. Заполни `infra/backend.env` и `infra/frontend.env`.
5. Собери и запусти весь стек:

```bash
make build
make migrate
```

## Повседневные команды

Запуск:

```bash
make up
```

Пересборка после изменений:

```bash
make build
```

Остановка:

```bash
make down
```

Логи:

```bash
make logs
```

Статус контейнеров:

```bash
make ps
```

Миграции:

```bash
make migrate
```

## Полезные проверки

Health backend:

```bash
curl -fsS http://127.0.0.1:8000/api/health
```

Проверка frontend:

```bash
curl -I http://127.0.0.1:3000
```

Проверка Keycloak:

```bash
curl -I http://127.0.0.1:8080
```
