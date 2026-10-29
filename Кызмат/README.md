# Kyzmat Marketplace (MVP+)

Маркетплейс услуг для Кыргызстана (аналог Profi.ru по функциональной логике с собственным дизайном).

## Стек

- Frontend: React + Tailwind + Vite
- Backend: Node.js + Express
- База данных: PostgreSQL

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Создайте env-файлы:

```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

3. Поднимите PostgreSQL (пример через Docker):

```bash
docker compose up -d
```

4. Инициализируйте схему:

```bash
psql -h localhost -U postgres -d kyzmat -f apps/api/sql/001_init.sql
```

5. Запустите проект:

```bash
npm run dev
```

По умолчанию:
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:4001`

## Диагностика базы

Если нужно быстро понять, доступен ли PostgreSQL и есть ли локальный snapshot данных:

```bash
npm run db:doctor
```

`db:doctor` теперь также показывает:
- доступен ли Docker daemon
- установлены ли локальные PostgreSQL binary
- блокирует ли Windows Application Control запуск PostgreSQL на этой машине

Если PostgreSQL уже поднят и нужно перенести текущие данные из local memory snapshot:

```bash
npm run db:restore-memory
```

## Production Deploy

### Render Free (VPN-only)

Проект уже содержит React-клиент, Express API и PostgreSQL, поэтому на Render он запускается как один Node.js Web Service: Express раздаёт собранный фронтенд и API на одном домене.

В корне есть `render.yaml`. Он задаёт сборку `npm ci && npm run build`, запуск `npm start`, проверку `/healthz`, бесплатный Web Service и PostgreSQL в регионе Frankfurt. Чтобы развернуть проект:

1. Создайте репозиторий GitHub и загрузите исходники проекта. Не загружайте `node_modules`, `logs`, настоящие `.env`-файлы или файлы базы данных. `.gitignore` исключает локальные зависимости, логи и секреты.
2. В Render создайте Blueprint и подключите этот репозиторий. Render прочитает `render.yaml`, создаст сервис и базу, а секреты `JWT_SECRET` и `ADMIN_PASSWORD` сгенерирует сам.
3. Первый запуск будет закрыт для посетителей, пока не задан VPN-адрес. Подключитесь к своему VPN и откройте страницу `onrender.com`: экран 403 покажет адрес, который видит сервер.
4. В настройках Web Service → Environment добавьте `VPN_ALLOWED_CIDRS` со значением вида `203.0.113.42/32` для IPv4 или `2001:db8::42/128` для IPv6. Используйте именно внешний адрес выхода VPN; адрес `192.168.x.x` с компьютера не подойдёт. Для нескольких адресов укажите CIDR через запятую. Сохраните переменную — Render перезапустит приложение.
5. Обновите страницу с подключённым VPN. Без VPN сайт и API возвращают 403. `/healthz` открыт Render только для проверки состояния и не раскрывает данные приложения.

Фильтр проверяет IP на сервере, включая API-запросы; на Render он читает адрес клиента из заголовка `CF-Connecting-IP`. Если адрес выхода VPN меняется, обновите `VPN_ALLOWED_CIDRS`. Не используйте `0.0.0.0/0`: приложение отвергает такие диапазоны. Встроенные правила Render для ограничения входящих IP веб-сервисов требуют плана Scale или Enterprise, поэтому Blueprint использует проверку в Express.

Render Free подходит для учебного показа, но не для постоянной базы: бесплатный Web Service засыпает после 15 минут без трафика, а бесплатная PostgreSQL-база заканчивается через 30 дней. До окончания срока сохраните данные или перейдите на постоянный тариф/базу. Подробности: [ограничения Render Free](https://render.com/docs/free), [срок бесплатной PostgreSQL-базы](https://render.com/docs/free#30-day-limit), [правила IP для Web Service](https://render.com/docs/inbound-ip-rules).

Пароль администратора создаётся как секрет Render. Посмотреть или заменить его можно в Environment; имя администратора по умолчанию — `admin`, кабинет — `/cabinet/admin`.

### Docker на собственном сервере

Для внешних пользователей теперь есть отдельный production-сценарий через Docker.

1. Скопируйте env-шаблон:

```bash
cp .env.production.example .env.production
```

2. Заполните в `.env.production` минимум:

```env
APP_ORIGIN=http://YOUR_SERVER_IP_OR_DOMAIN
WEB_PORT=80
POSTGRES_DB=kyzmat
POSTGRES_USER=kyzmat
POSTGRES_PASSWORD=strong-db-password
JWT_SECRET=strong-jwt-secret
JWT_EXPIRES_IN=7d
SEED_DEMO_DATA=false
ALLOW_MEMORY_FALLBACK=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-admin-password
ADMIN_EMAIL=admin@kyzmat.local
```

3. На сервере запустите production-стек:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Или через npm:

```bash
npm run deploy:up
```

Что поднимется:
- `postgres` для постоянных данных
- `api` на внутреннем порту `4000`
- `web` с `nginx` на внешнем порту `80`

Как это работает:
- фронтенд отдается одной ссылкой, например `http://SERVER_IP`
- все вызовы API идут через относительный `/api`
- `nginx` проксирует `/api/*` в backend
- маршруты React работают через SPA fallback

Важно:
- в `APP_ORIGIN` укажите тот адрес, с которого люди реально будут открывать сайт
- если будете подключать домен и HTTPS, сохраните тот же публичный origin
- порт `80` должен быть открыт на сервере
- в production отключите demo-данные: `SEED_DEMO_DATA=false`
- в production отключите memory fallback: `ALLOW_MEMORY_FALLBACK=false`
- если вы сознательно включаете demo-seed, задавайте `DEMO_SEED_PASSWORD` вручную
- лог с demo-аккаунтами создавайте только при явном `LOG_DEMO_CREDENTIALS=true`
- системный администратор создается при старте API: логин берется из `ADMIN_USERNAME`, пароль из `ADMIN_PASSWORD`

## Администратор

В development по умолчанию доступен администратор:

- логин: `admin`
- пароль: `admin123`
- кабинет: `/cabinet/admin`

В production обязательно задайте свой `ADMIN_PASSWORD` в `.env.production`.

## Реализованные API

- Auth: `POST /auth/register`, `POST /auth/login`
- Users: `GET /users/me`
- Admin: `GET /admin/overview`, `GET /users (admin only)`
- Workers: `GET /workers`, `GET /workers/:workerId`
- Jobs:
  - `GET /jobs`
  - `GET /jobs/:jobId`
  - `GET /jobs/:jobId/responses`
  - `POST /jobs`
  - `POST /jobs/respond`
  - `POST /jobs/:jobId/select-worker`
  - `PATCH /jobs/:jobId/status`
- Reviews: `POST /reviews`
- Messages: `GET /messages`, `POST /messages`
- Categories: `GET /categories`

## Реализованный интерфейс

- Главная с поиском услуг
- Каталог заказов + фильтры + сортировка
- Детали заказа + отклики + выбор исполнителя
- Каталог исполнителей
- Регистрация / вход
- Профиль с историей заказов
- Чат с выбором собеседника
- Создание заказа
- Раздельные кабинеты:
  - `/cabinet/customer` (заказчик)
  - `/cabinet/worker` (исполнитель)
  - `/cabinet/admin` (администратор)

## Что покрыто по ТЗ

- роли пользователей (Customer / Worker / Admin)
- заказы и отклики
- отзывы и рейтинг
- внутренние сообщения
- категории услуг
- геополя и радиус поиска
- базовые статусы безопасной сделки (`escrow_status`)
- спорные ситуации (`disputes` таблица)
- задел под монетизацию (`is_pro`)

## Примечание

- в development API может временно использовать local memory fallback, если PostgreSQL недоступен
- в production fallback должен быть выключен, и сервер не должен стартовать без PostgreSQL
- на некоторых Windows-машинах локальный PostgreSQL может блокироваться системной политикой (`Application Control policy has blocked this file`); в таком случае поднимайте базу через Docker Desktop или через системного администратора
