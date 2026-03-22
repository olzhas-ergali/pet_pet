# Оптовая биржа (MVP)

Vite + React + Supabase (Postgres, Auth, Realtime).

## Git-ветки

| Ветка | Назначение |
|-------|------------|
| `test` | Ручные проверки, QA, стабилизация перед слиянием в `dev`. |
| `dev` | Ежедневная разработка; feature-ветки сливаются сюда. |
| `main` | Релизы / демо для инвесторов; только проверенный код (из `dev` или `test`). |

Поток: **feature → `dev` → (при необходимости) `test` → `main`**. На GitHub уже созданы три ветки с общим начальным коммитом.

```bash
git checkout dev
git pull origin dev
# после работы:
git push origin dev
```

## Быстрый старт

1. Создайте проект в [Supabase](https://supabase.com), включите **Phone** auth (или используйте email/password для демо).
2. SQL Editor: выполните по порядку файлы из `supabase/migrations/` (включая `validate_cart_stock` для проверки остатков до заказа).
3. **Database → Replication**: убедитесь, что таблица `prices` в публикации `supabase_realtime` (миграция добавляет её).
4. Скопируйте `.env.example` → `.env` / `.env.local`, укажите `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
5. Для входа без SMS: Auth → создайте пользователя с email/password, пропишите `VITE_DEV_LOGIN_EMAIL` и `VITE_DEV_LOGIN_PASSWORD`.
6. Назначьте роли в SQL:
   - `update public.profiles set role = 'admin' where id = '…uuid…';`
   - `update public.profiles set role = 'supplier' where id = '…uuid…';`

```bash
npm install
npm run dev
```

## BFF (Backend for Frontend)

Стек: **Express** (`server/`) → Supabase с JWT пользователя (RLS сохраняется) + **service role** для очереди событий.

- Запуск: `npm run dev:bff` (порт **3001**) и в другом терминале `npm run dev`, либо `npm run dev:full`.
- В `.env` фронта: `VITE_USE_BFF=true`. Vite проксирует `/api` → `localhost:3001`.
- Переменные сервера: см. `server/.env.example` (`SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, опционально `WEBHOOK_FORWARD_URL`, `INTERNAL_WEBHOOK_SECRET`, Telegram).

Эндпоинты: `GET/POST /api/v1/...` — каталог (цены и оптовые ступени считаются на сервере), заказы, `POST /api/v1/pricing/quote`, `POST /api/v1/pricing/cart-quote` (итог корзины и доставка), `GET /api/v1/inventory/:id`. Внутренний воркер: `POST /api/internal/webhooks/dispatch` (заголовок `X-Internal-Secret`).

Проверка: `npm test` (включая `shared/` и `server/domain`), `npm run build`. Ручная проверка UI: `npm run dev:full`, в `.env` фронта `VITE_USE_BFF=true`, открыть каталог → корзина → оформление; суммы должны совпадать с ответом BFF. Быстрый health-check: `curl -s http://localhost:3001/health`.

События в БД: миграция `integration_events` + триггеры `price_updated` / `order_created`; обработка очереди и проброс во внешний URL — в `server/services/eventDispatcher.ts`. Заглушки: `server/integrations/*` (оплата, доставка, Telegram).

## Docker

Сборка фронта (передайте переменные при build — они зашиваются в клиент):

```bash
export VITE_SUPABASE_URL=...
export VITE_SUPABASE_ANON_KEY=...
docker compose build
docker compose up -d web
```

Откройте http://localhost:8080

Опционально чистый Postgres: `docker compose up -d db` (порт **5433**). Полная схема как в облаке — через **Supabase CLI**: `npm run db:start`, затем `npm run db:reset` (нужен Docker). Подробнее: **[docs/LOCAL-POSTGRES.md](docs/LOCAL-POSTGRES.md)**.

## Тесты

```bash
npm run test:smoke   # быстрый смоук UI
npm test             # все unit/integration Vitest
```

## Бесплатное развёртывание (тест / демо)

- **[docs/DEPLOY-FREE.md](docs/DEPLOY-FREE.md)** — Supabase Free + Vercel/Netlify/Cloudflare Pages; опционально BFF на Render и т.д.

## Полный аудит и QA

- **[docs/FULL-PROJECT-AUDIT-REPORT.md](docs/FULL-PROJECT-AUDIT-REPORT.md)** — запуск (npm/Docker), архитектура, таблицы/RPC/триггеры, edge-кейсы, баги, рекомендации, экспорт в PDF.
- **[docs/MANUAL-QA-CHECKLIST.md](docs/MANUAL-QA-CHECKLIST.md)** — пошаговое ручное тестирование после каждого релиза.
