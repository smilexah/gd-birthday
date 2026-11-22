# API

Базовый путь `/api`. Формат JSON, время в ISO 8601 (UTC). Ошибки: `{ "error": "<code>", "message": "<текст для разработчика>" }`.

## Справочники

| Поле | Значения |
|---|---|
| `workplace` | `apt` аптека, `fil` филиал, `off` головной офис, `log` логистический центр, `reg` регионы |
| `flavor` | `V` ванильный, `B` ягодный, `C` шоколадный, `G` фисташковый |
| `lang` | `ru`, `kk` (язык интерфейса автора в момент отправки) |
| `status` | `visible`, `hidden`, `deleted` |

Публичное поздравление `Wish`:

```json
{ "id": 15, "number": 15, "name": "Айгерим", "workplace": "apt", "city": "Алматы", "text": "...", "flavor": "B", "createdAt": "2026-11-21T08:00:00.000Z" }
```

`number` сквозной (sequence в PostgreSQL), не переиспользуется после удаления.

Админское поздравление `AdminWish` = `Wish` + `{ "status": "visible", "lang": "ru", "reports": 2 }`.

## Публичные методы

### `GET /api/feed?cursor=&filter=&limit=`

Только `visible`, сортировка по `number` по убыванию (новые первыми, как `unshift` в макете).

- `cursor` — номер, вернуть записи с `number < cursor`. Пусто — с самого нового.
- `filter` — `all` (по умолчанию) или код `workplace`.
- `city` — необязательный, точное совпадение без учёта регистра (для `apt` и `fil`).
- `since` — вернуть записи с `number > since` по возрастанию (для опроса, если SSE недоступен). Вместе с `cursor` не используется.
- `limit` — 1..100, по умолчанию 50.

Ответ: `{ "items": Wish[], "nextCursor": 35 | null }`. Кэш в памяти 3 секунды по ключу запроса, хранится готовый JSON; одновременные промахи кэша делают один запрос к базе. Новое поздравление кэш не сбрасывает (оно приходит клиентам через SSE), скрытие, удаление и смена настроек сбрасывают.

### `GET /api/stats`

`{ "total": 1248, "byWorkplace": { "apt": 600, "fil": 300, "off": 100, "log": 148, "reg": 100 }, "accepting": true, "closesAt": "2026-11-24T18:59:00.000Z" | null }`

`total` — число `visible`. Кэш 3 секунды.

### `POST /api/wishes`

Тело: `{ "name", "workplace", "city"?, "text", "flavor", "lang", "website" }`.

- `name` — обязательно, 1..30 символов после trim, одно слово (без фамилии): без пробелов внутри, допускается дефис.
- `workplace` — из справочника.
- `city` — 0..30 символов, учитывается только для `apt` и `fil`, иначе сохраняется `null`. Необязателен (в макете город не обязателен).
- `text` — обязательно, 1..500 символов после trim.
- `flavor` — из справочника.
- `website` — поле-ловушка. Если не пустое: ответ `201` с фиктивными данными, в базу не пишется.

Ответ `201`: `{ "wish": Wish, "authorToken": "<случайная строка>" }`. В базе хранится только SHA-256 токена. Клиент кладёт токен в `localStorage` по ключу `gd-tokens` (объект `{ [id]: token }`).

Ошибки: `400 validation` (поле в `field`), `400 links`, `400 profanity`, `409 duplicate` (тот же текст с тем же именем и местом работы уже есть), `403 closed`, `429 rate_limited` (30 поздравлений в 10 минут с IP).

### `DELETE /api/wishes/:id`

Заголовок `X-Author-Token`. Пока приём открыт. `204`, `403 forbidden`, `403 closed`, `404 not_found`. Ставит `status = deleted`.

### `POST /api/wishes/:id/report`

Тело пустое. `204`. Повторная жалоба с того же IP на то же поздравление не создаёт дубль. Лимит 20 в 10 минут с IP.

### `GET /api/events`

Server-Sent Events. События:

- `wish` — `data: Wish` (новое видимое поздравление или снова показанное админом).
- `removed` — `data: { "id": 15 }` (скрыто или удалено).
- `stats` — `data: { "total": 1249 }`.
- `settings` — `data: { "accepting": false, "closesAt": null }`.

Каждые 25 секунд комментарий `: ping`. Если SSE не подключается, клиент раз в 5 секунд опрашивает `GET /api/feed?since=<макс. номер>` и `GET /api/stats`.

## Админка

Сессия: `POST /api/admin/login` ставит cookie `gd_admin` (httpOnly, SameSite=Strict, Secure при `COOKIE_SECURE=true`, Path=/api/admin, 12 часов). Значение — подписанный HMAC-SHA256 токен (`SESSION_SECRET`) с временем истечения. Все методы ниже, кроме логина, без cookie отвечают `401 unauthorized`.

| Метод | Описание |
|---|---|
| `POST /api/admin/login` `{ login, password }` | `204` или `401 bad_credentials`. Лимит 10 в 15 минут с IP. Сравнение через `timingSafeEqual`. |
| `POST /api/admin/logout` | `204`, удаляет cookie |
| `GET /api/admin/me` | `{ "login": "admin" }` |
| `GET /api/admin/stats` | `{ total, visible, hidden, reported, byWorkplace, byDay: [{ "day": "2026-11-20", "count": 10 }], latest: AdminWish[6], accepting, isOpen, closesAt }` — `byDay` по дате Астаны (UTC+5), `total` без `deleted` |
| `GET /api/admin/wishes?q=&workplace=&status=&page=&pageSize=` | `status`: `all` (по умолчанию, без `deleted`), `visible`, `hidden`, `reported`. Поиск по имени и тексту (ILIKE). Ответ `{ items: AdminWish[], total, page, pageSize }`, `pageSize` по умолчанию 20 |
| `PATCH /api/admin/wishes/:id` `{ status: "visible" \| "hidden" }` | `AdminWish` |
| `DELETE /api/admin/wishes/:id` | `204`, `status = deleted` |
| `GET /api/admin/reports` | `{ items: AdminWish[] }` — не удалённые, у которых есть жалобы, по числу жалоб по убыванию |
| `POST /api/admin/wishes/:id/dismiss-reports` | `204`, удаляет жалобы («Оставить») |
| `GET /api/admin/settings` | `{ isOpen, closesAt, accepting }` |
| `PUT /api/admin/settings` `{ isOpen?, closesAt? }` | то же. Если открыть после `closesAt`, `closesAt` сбрасывается в `null`, если новый не передан |
| `GET /api/admin/export.xlsx` | файл `gd-wishes-YYYY-MM-DD.xlsx`: №, имя, место работы, город, пожелание, вкус, язык, дата (Астана), статус, жалобы. Все записи, включая скрытые и удалённые |

`accepting = isOpen && (closesAt === null || now < closesAt)`. По умолчанию `closesAt = 2026-11-25T00:00:00+05:00`: 24.11 23:59:59 по Астане ещё принимается, 00:00:00 25.11 уже нет. Сервер держит таймер на ближайшее `closesAt` (пересчитывается при старте и при `PUT /api/admin/settings`, плюс проверка раз в 30 секунд) и в момент закрытия рассылает событие `settings`.

## Служебные

`GET /api/health` → `{ "ok": true }` (проверяет `SELECT 1`).
