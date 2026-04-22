# Docker Operations Runbook

Команды для production-схемы, где:

- `postgres` в Docker
- `keycloak` в Docker
- `backend` в Docker
- `frontend` в Docker
- `caddy` на хосте через `systemd`

Документ предполагает, что проект лежит в:

```bash
/srv/battle-of-algorithms
```

И что основной compose-файл:

```bash
/srv/battle-of-algorithms/infra/docker-compose.yml
```

## 1. Базовые алиасы

Чтобы не писать длинные команды каждый раз:

```bash
cd /srv/battle-of-algorithms
export BOA_COMPOSE="docker-compose -f infra/docker-compose.yml"
```

## 2. Полный запуск всего стека

Запуск контейнеров:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d
sudo systemctl start caddy
```

Если после обновления кода нужны миграции:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
```

## 3. Полная остановка

Остановка reverse proxy:

```bash
sudo systemctl stop caddy
```

Остановка контейнеров:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml down
```

Важно:

- `down` не удаляет данные Postgres
- `down -v` удаляет volumes, использовать только если осознанно хочешь снести БД

## 4. Перезапуск всего стека

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml down
docker-compose -f infra/docker-compose.yml up -d
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl start caddy
```

## 5. Обновление после `git pull`

```bash
cd /srv/battle-of-algorithms
git pull
docker-compose -f infra/docker-compose.yml up -d --build
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl restart caddy
```

Если нужно пересобрать только один сервис:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d --build backend
docker-compose -f infra/docker-compose.yml up -d --build frontend
```

## 6. Проверка состояния

Проверка контейнеров:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml ps
```

Проверка `Caddy`:

```bash
sudo systemctl status caddy --no-pager
```

Проверка портов:

```bash
ss -tulpn | grep -E ':3000|:8000|:8080|:5432|:80|:443'
```

## 7. Логи

Все контейнеры:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml logs --tail=100
```

Отдельные сервисы:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml logs --tail=100 postgres
docker-compose -f infra/docker-compose.yml logs --tail=100 keycloak
docker-compose -f infra/docker-compose.yml logs --tail=100 backend
docker-compose -f infra/docker-compose.yml logs --tail=100 frontend
```

Follow-режим:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml logs -f backend
docker-compose -f infra/docker-compose.yml logs -f frontend
```

Логи `Caddy`:

```bash
sudo journalctl -u caddy -n 100 --no-pager
sudo journalctl -u caddy -f
```

## 8. Миграции

Применить миграции:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
```

Посмотреть текущую ревизию:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec backend alembic current
```

История миграций:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec backend alembic history
```

## 9. Вход внутрь контейнеров

Backend:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec backend sh
```

Frontend:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec frontend sh
```

Postgres:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec postgres psql -U boa -d battle_of_algorithms
```

Keycloak:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml exec keycloak sh
```

## 10. Health-check команды

Внутренние:

```bash
curl -I http://127.0.0.1:8000/docs
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8080
```

Внешние:

```bash
curl -I https://boa.rezyjs.ru
curl -I https://auth.boa.rezyjs.ru
```

## 11. Если нужно пересобрать frontend с новыми env

Если менялся `.env.docker` или фронтовые переменные:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d --build frontend
```

Если менялся backend env:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d --build backend
```

## 12. Если нужно снести и поднять только приложение

Без удаления Postgres/Keycloak:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml stop frontend backend
docker-compose -f infra/docker-compose.yml rm -f frontend backend
docker-compose -f infra/docker-compose.yml up -d --build frontend backend
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
```

## 13. Если сломался только один контейнер

Перезапуск:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml restart backend
docker-compose -f infra/docker-compose.yml restart frontend
docker-compose -f infra/docker-compose.yml restart keycloak
docker-compose -f infra/docker-compose.yml restart postgres
```

Пересборка:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d --build backend
docker-compose -f infra/docker-compose.yml up -d --build frontend
```

## 14. Если нужен полностью чистый перезапуск без удаления БД

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml down
docker-compose -f infra/docker-compose.yml up -d --build
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl start caddy
```

## 15. Если нужно снести вообще всё, включая Postgres data

Опасно. Удалит данные базы.

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml down -v
docker image rm infra_backend infra_frontend
```

Потом заново:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d --build
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl start caddy
```

## 16. Проверка образов

```bash
docker images | grep -E 'infra_backend|infra_frontend'
```

## 17. Проверка почему контейнер не стартует

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml ps
docker-compose -f infra/docker-compose.yml logs --tail=200 backend
docker-compose -f infra/docker-compose.yml logs --tail=200 frontend
docker-compose -f infra/docker-compose.yml logs --tail=200 keycloak
docker-compose -f infra/docker-compose.yml logs --tail=200 postgres
```

Если проблема с reverse proxy:

```bash
sudo systemctl status caddy --no-pager
sudo caddy validate --config /etc/caddy/Caddyfile
sudo journalctl -u caddy -n 200 --no-pager
```

## 18. Что больше не использовать

После переезда на Docker не нужно поднимать старые app unit'ы:

```bash
sudo systemctl start boa-backend
sudo systemctl start boa-frontend
```

Эти unit'ы должны оставаться выключенными.

Проверка:

```bash
sudo systemctl is-enabled boa-backend
sudo systemctl is-enabled boa-frontend
```

Нормально, если там:

```text
disabled
```

## 19. Минимальный ежедневный набор команд

Проверить:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml ps
sudo systemctl status caddy --no-pager
```

Обновить:

```bash
cd /srv/battle-of-algorithms
git pull
docker-compose -f infra/docker-compose.yml up -d --build
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head
sudo systemctl restart caddy
```

Остановить:

```bash
sudo systemctl stop caddy
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml down
```

Запустить:

```bash
cd /srv/battle-of-algorithms
docker-compose -f infra/docker-compose.yml up -d
sudo systemctl start caddy
```
