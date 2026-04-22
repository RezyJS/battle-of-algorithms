# Docker Operations Runbook

Команды для production-схемы:

- `postgres` в Docker
- `keycloak` в Docker
- `backend` в Docker
- `frontend` в Docker
- `caddy` на VPS через `systemd`

Рабочая директория:

```bash
cd /srv/battle-of-algorithms
```

Compose-файл:

```bash
infra/docker-compose.yml
```

Важно:

- `down -v` удаляет volume Postgres

## 1. Запуск

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml up -d
sudo systemctl start caddy
```

## 2. Запуск с пересборкой

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml up -d --build
sudo systemctl restart caddy
```

## 3. Миграции

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml exec backend alembic upgrade head
```

Проверить текущую ревизию:

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml exec backend alembic current
```

## 4. Остановка

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml down
```

## 5. Полный рестарт

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl start caddy
```

## 6. Деплой после `git pull`

```bash
cd /srv/battle-of-algorithms
git pull
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl restart caddy
```

## 7. Проверка состояния

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml ps
sudo systemctl status caddy --no-pager
ss -tulpn | grep -E ':3000|:8000|:8080|:5432|:80|:443'
```

## 8. Логи

Все сервисы:

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml logs --tail 100
```

Отдельные:

```bash
docker logs --tail 100 boa-frontend
docker logs --tail 100 boa-backend
docker logs --tail 100 boa-keycloak
docker logs --tail 100 boa-postgres
```

`Caddy`:

```bash
sudo journalctl -u caddy -n 100 --no-pager
sudo journalctl -u caddy -f
```

## 9. Health-check

Внутренние:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8000/docs
curl -I http://127.0.0.1:8080
```

Внешние:

```bash
curl -I https://boa.rezyjs.ru
curl -I https://auth.boa.rezyjs.ru
```

## 10. Вход в контейнеры

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml exec frontend sh
docker compose -f infra/docker-compose.yml exec backend sh
docker compose -f infra/docker-compose.yml exec keycloak sh
docker compose -f infra/docker-compose.yml exec postgres psql -U boa -d battle_of_algorithms
```

## 11. Пересборка только одного сервиса

```bash
cd /srv/battle-of-algorithms
docker compose -f infra/docker-compose.yml up -d --build frontend
docker compose -f infra/docker-compose.yml up -d --build backend
```

## 12. Если Keycloak только что поднялся

Первые 20–60 секунд `auth` может отдавать `502`.

Проверка:

```bash
curl -I http://127.0.0.1:8080
docker logs --tail 100 boa-keycloak
```

## 13. Если auth снова сломался

После неудачного входа сразу смотри:

```bash
docker logs --tail 100 boa-frontend
docker logs --tail 100 boa-backend
docker logs --tail 100 boa-keycloak
```

## 14. Старые unit'ы приложения

```bash
sudo systemctl start boa-backend
sudo systemctl start boa-frontend
```
