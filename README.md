# Сайт поздравления генерального директора INKAR

Публичная страница, где сотрудники INKAR оставляют поздравления генеральному директору Алие Джайдаковне с днём рождения 24.11.2026. Каждое поздравление — кусочек общего торта, счётчик и лента обновляются вживую. Есть админка `/admin` для модерации, жалоб, выгрузки в Excel и режима показа.

- ТЗ: [docs/tz-gd-birthday.md](docs/tz-gd-birthday.md)
- API: [docs/api/README.md](docs/api/README.md)
- Макеты: `docs/gd-birthday-main-v12.html`, `docs/gd-admin.html`

Приём поздравлений идёт до **24.11.2026 23:59:59 по Астане** включительно и закрывается автоматически в 25.11.2026 00:00 (UTC+5), независимо от часового пояса сервера. Сервер ставит таймер на время закрытия, и открытые страницы получают событие SSE сразу, без перезагрузки. Вручную приём открывается и закрывается в админке, раздел «Настройки».

## Стек

- `backend/` — Node.js 26, TypeScript, Fastify, PostgreSQL. Миграции — SQL-файлы в `backend/migrations/`, применяются автоматически при старте.
- `frontend/` — Vue 3, Vite, vue-i18n (русский и казахский).
- Деплой — один Docker-образ (backend отдаёт собранный фронтенд) и PostgreSQL 18 в docker compose.

Примечание: во фронтенде TypeScript 6, потому что vue-tsc пока не поддерживает TypeScript 7.

## Запуск локально

Нужны Node.js 26 и Docker.

```bash
cp .env.example .env          # заполнить CHANGE_ME, для локальной разработки COOKIE_SECURE=false
docker run -d --name gd-pg -p 5432:5432 \
  -e POSTGRES_USER=gd -e POSTGRES_PASSWORD=<пароль из .env> -e POSTGRES_DB=gd_birthday \
  postgres:18-alpine

cd backend && npm ci && npm run dev      # http://localhost:3000, API /api
cd frontend && npm ci && npm run dev     # Vite dev-сервер
```

Тестовые данные (только при `SEED_ENABLED=true` в `.env`):

```bash
cd backend && npm run build && npm run seed
```

## Тесты

Нужен пустой PostgreSQL для тестов, например временный контейнер:

```bash
docker run -d --name gd-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=gd_test -p 5434:5432 postgres:18-alpine
cd backend
TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:5434/gd_test npm test
docker rm -f gd-test-pg
```

Тесты проверяют границу приёма (23:59:59 по Астане принимается, 00:00:00 25.11 нет) в разных часовых поясах сервера, автоматическое закрытие через минуту с событием SSE и ручное открытие после закрытия. Интеграционный тест идёт около 70 секунд. Без `TEST_DATABASE_URL` выполняются только unit-тесты.

## Нагрузочный тест

Скрипты в `loadtest/`, в образ приложения не попадают. Сценарий: 2000 читателей ленты и счётчика (по 1 запросу в секунду на ленту и на счётчик), 500 открытых SSE-соединений и 100 отправок поздравлений за минуту с разных IP, 60 секунд. Нагрузка идёт из контейнера в сети compose, IP подставляются через `X-Forwarded-For`, поэтому в `.env` нужен `TRUST_PROXY=true`.

**Тест удаляет все поздравления и жалобы из базы.** Запускать только на локальном или тестовом стенде:

```bash
docker compose up -d --build
cd loadtest
npm ci
npm start -- --wipe-database
```

Скрипт заполняет базу 2000 поздравлениями, запускает нагрузку, снимает `docker stats` и число соединений к базе, печатает p50, p95, p99, долю ошибок и проверку критериев, сохраняет результат в `loadtest/results/` и очищает базу. Параметры меняются переменными `DURATION`, `READERS`, `READER_RATE`, `SSE_CLIENTS`, `WISHES_PER_MINUTE`, `SEED_COUNT`.

## Переменные окружения

Все переменные задаются в `.env` (шаблон — `.env.example`). Файл `.env` в Git не коммитится.

| Переменная | Назначение | Пример / по умолчанию |
|---|---|---|
| `PORT` | порт сервера внутри контейнера | `3000` |
| `HOST` | адрес прослушивания | `0.0.0.0` |
| `DATABASE_URL` | строка подключения к PostgreSQL. В compose собирается из `POSTGRES_*` автоматически | `postgres://gd:...@localhost:5432/gd_birthday` |
| `ADMIN_LOGIN` | логин админки | `admin` |
| `ADMIN_PASSWORD` | пароль админки | длинный случайный |
| `SESSION_SECRET` | ключ HMAC для подписи cookie админки | случайная строка от 32 символов |
| `IP_HASH_SALT` | соль для хеширования IP (в базе хранится только хеш) | случайная строка |
| `COOKIE_SECURE` | флаг Secure у cookie админки. `true` за HTTPS, `false` для локального http | `true` |
| `TRUST_PROXY` | доверять `X-Forwarded-For` от reverse proxy (нужно для лимитов по IP) | `true` |
| `STATIC_DIR` | папка собранного фронтенда. В образе `/app/public` | `../frontend/dist` |
| `LOG_LEVEL` | уровень логов pino | `info` |
| `SEED_ENABLED` | разрешает `npm run seed`. В проде `false` | `false` |
| `POSTGRES_USER` | пользователь базы (compose) | `gd` |
| `POSTGRES_PASSWORD` | пароль базы (compose) | длинный случайный |
| `POSTGRES_DB` | имя базы (compose) | `gd_birthday` |
| `APP_PORT` | порт приложения на хосте (compose) | `3000` |

Случайные значения можно получить так: `openssl rand -hex 32`. `POSTGRES_PASSWORD` подставляется в URL, поэтому в нём лучше только буквы и цифры (hex подходит).

## Сборка и деплой (docker compose)

```bash
cp .env.example .env     # заполнить все CHANGE_ME, COOKIE_SECURE=true, TRUST_PROXY=true
docker compose up -d --build
docker compose ps        # app и db должны быть healthy
curl http://127.0.0.1:3000/api/health   # {"ok":true}
```

- Приложение слушает порт `3000` на хосте (меняется через `APP_PORT`). Порт базы наружу не публикуется.
- База хранится в именованном томе `gd-birthday_db-data`.
- Обновление: `docker compose up -d --build` (миграции применятся при старте).
- Логи: `docker compose logs -f app`.

### Reverse proxy и HTTPS

HTTPS, сертификат и поддомен настраивает администратор сервера. Требования к proxy:

- проксировать на `http://127.0.0.1:3000`;
- не буферизовать `/api/events` (Server-Sent Events), иначе новые поздравления не будут приходить вживую;
- передавать `X-Forwarded-For` и `X-Forwarded-Proto` (лимиты частоты считаются по IP клиента).

Пример для nginx:

```nginx
location /api/events {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Если SSE всё же не проходит, фронтенд переключается на опрос раз в 5 секунд — сайт работает, но с задержкой.

### Seed в docker

```bash
# в .env временно SEED_ENABLED=true, затем
docker compose up -d
docker compose exec app npm run seed
# вернуть SEED_ENABLED=false и docker compose up -d
```

В проде `SEED_ENABLED` держать `false`.

### Смена пароля админки

Изменить `ADMIN_PASSWORD` в `.env` и выполнить `docker compose up -d` (контейнер пересоздастся с новым значением).

## Резервная копия базы

```bash
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/gd-$(date +%F-%H%M).dump
```

Восстановление:

```bash
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backups/gd-YYYY-MM-DD-HHMM.dump
```

Папка `backups/` в Git не попадает. На время приёма делать копию хотя бы раз в день (например, через cron).

## Удаление после праздника

Данные сотрудников хранятся только на время праздника. После выгрузки в Excel (если нужна):

```bash
docker compose down -v            # остановить и удалить контейнеры и том с базой
docker image rm gd-birthday:latest
rm -rf backups/                   # удалить резервные копии
cd .. && rm -rf gd-birthday       # удалить папку проекта
```

Также удалить конфигурацию сайта в reverse proxy и, при необходимости, DNS-запись поддомена.

## Частые проблемы

- **Лента не обновляется вживую** — proxy буферизует `/api/events`, см. пример nginx выше.
- **429 при отправке** — сработал лимит (30 поздравлений за 10 минут с IP, с запасом на общий NAT офиса). Если у всех один IP, проверить `TRUST_PROXY=true` и передачу `X-Forwarded-For`.
- **«Приём закрыт»** — наступило время закрытия или приём выключен вручную; открыть в админке, «Настройки».
- **База не стартует** — `docker compose logs db`. Для postgres 18 том монтируется в `/var/lib/postgresql` (не в `/var/lib/postgresql/data`); старый том от другой версии PostgreSQL не подойдёт.
- **Не входит в админку по http** — для локального запуска без HTTPS нужен `COOKIE_SECURE=false`.
- **`npm ci` падает в Docker: «Missing: @emnapi/... from lock file»** — `frontend/package-lock.json` перезаписан `npm install` на Windows без пакетов для Linux. Пересоздать lock в контейнере: `docker run --rm -v "$PWD/frontend:/w" -w /w node:26-alpine npm install --package-lock-only`.
