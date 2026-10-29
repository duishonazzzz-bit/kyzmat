CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id INT NOT NULL REFERENCES roles(id),
  full_name VARCHAR(160) NOT NULL,
  full_name_ky VARCHAR(160),
  full_name_en VARCHAR(160),
  username VARCHAR(80),
  email VARCHAR(160) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash TEXT NOT NULL,
  city VARCHAR(120),
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  worker_resume TEXT NOT NULL DEFAULT '{}',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_ky VARCHAR(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  category_id INT NOT NULL REFERENCES categories(id),
  job_type VARCHAR(20) NOT NULL DEFAULT 'order' CHECK (job_type IN ('order', 'vacancy')),
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  city VARCHAR(120) NOT NULL,
  address VARCHAR(240),
  location_note TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  worker_live_status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (worker_live_status IN ('idle', 'en_route', 'arrived')),
  worker_live_latitude NUMERIC(9, 6),
  worker_live_longitude NUMERIC(9, 6),
  worker_live_updated_at TIMESTAMPTZ,
  radius_km INT,
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  escrow_status VARCHAR(20) NOT NULL DEFAULT 'not_required' CHECK (escrow_status IN ('not_required', 'reserved', 'released', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address VARCHAR(240);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_note TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(20) NOT NULL DEFAULT 'order';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_live_status VARCHAR(20) NOT NULL DEFAULT 'idle';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_live_latitude NUMERIC(9, 6);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_live_longitude NUMERIC(9, 6);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_live_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id),
  message TEXT,
  proposed_price NUMERIC(12, 2) NOT NULL,
  eta_days INT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, worker_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  file_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (body IS NOT NULL OR file_url IS NOT NULL)
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  admin_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  role_scope VARCHAR(20) NOT NULL CHECK (role_scope IN ('customer', 'worker', 'all')),
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
  price NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'KGS',
  description TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_pro BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  amount_paid NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'KGS',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_services (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  target_role VARCHAR(20) NOT NULL CHECK (target_role IN ('customer', 'worker', 'all')),
  billing_type VARCHAR(32) NOT NULL CHECK (billing_type IN ('one_time', 'subscription_included')),
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'KGS',
  description TEXT NOT NULL,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id INT NOT NULL REFERENCES platform_services(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'in_progress', 'completed', 'cancelled')),
  price NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'KGS',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_responses_job_id ON responses(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id, status, ends_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_user ON service_orders(user_id, created_at);

INSERT INTO roles(name) VALUES ('customer'), ('worker'), ('admin') ON CONFLICT DO NOTHING;
INSERT INTO categories(name)
VALUES
  ('ремонт'),
  ('ремонт квартир и домов'),
  ('отделочные работы'),
  ('сантехника'),
  ('электрика'),
  ('плиточные работы'),
  ('столярные и плотницкие работы'),
  ('сварка'),
  ('кровельные работы'),
  ('фасадные работы'),
  ('окна и двери'),
  ('установка и ремонт техники'),
  ('сборка мебели'),
  ('проектирование и дизайн'),
  ('уборка'),
  ('уборка квартир и домов'),
  ('генеральная уборка'),
  ('мытье окон'),
  ('глажка и стирка'),
  ('домработницы'),
  ('сиделки'),
  ('няни'),
  ('помощь по хозяйству'),
  ('маникюр и педикюр'),
  ('парикмахерские услуги'),
  ('косметология'),
  ('массаж'),
  ('визаж'),
  ('эпиляция'),
  ('татуаж'),
  ('спа-процедуры'),
  ('доставка'),
  ('переезды'),
  ('IT'),
  ('дизайн'),
  ('репетиторы'),
  ('строительство'),
  ('школьные предметы'),
  ('иностранные языки'),
  ('подготовка к экзаменам'),
  ('музыка'),
  ('танцы'),
  ('профессиональные курсы'),
  ('онлайн-обучение'),
  ('обучение программированию'),
  ('программирование'),
  ('создание сайтов'),
  ('дизайн (графический и веб)'),
  ('копирайтинг и тексты'),
  ('маркетинг и реклама'),
  ('SEO'),
  ('администрирование'),
  ('тестирование ПО'),
  ('юристы'),
  ('адвокаты'),
  ('составление документов'),
  ('бухгалтерия'),
  ('налоги и отчетность'),
  ('консультации по бизнесу'),
  ('страхование'),
  ('автоинструкторы'),
  ('ремонт автомобилей'),
  ('диагностика авто'),
  ('шиномонтаж'),
  ('тюнинг'),
  ('помощь на дороге'),
  ('курьерская доставка'),
  ('грузоперевозки'),
  ('грузчики'),
  ('перевозка мебели'),
  ('доставка еды и товаров'),
  ('выгул собак'),
  ('передержка животных'),
  ('груминг'),
  ('дрессировка'),
  ('ветеринарные услуги'),
  ('персональные тренеры'),
  ('фитнес'),
  ('йога'),
  ('единоборства'),
  ('реабилитация'),
  ('ЛФК'),
  ('психологи'),
  ('психотерапевты'),
  ('коучи'),
  ('профориентация'),
  ('ведущие'),
  ('аниматоры'),
  ('музыканты для мероприятий'),
  ('диджеи'),
  ('фотографы'),
  ('видеографы'),
  ('оформление мероприятий'),
  ('художники'),
  ('дизайнеры'),
  ('рукоделие'),
  ('изготовление на заказ'),
  ('пошив одежды'),
  ('ремонт одежды'),
  ('ателье'),
  ('дизайн одежды'),
  ('подбор персонала'),
  ('консалтинг'),
  ('тендеры'),
  ('автоматизация бизнеса'),
  ('CRM и IT-внедрение'),
  ('установка сигнализации'),
  ('видеонаблюдение'),
  ('пожарная безопасность'),
  ('контроль доступа'),
  ('настройка телескопов'),
  ('программирование радиостанций'),
  ('NFC-метки'),
  ('аромадиффузоры'),
  ('BIM и CAD'),
  ('производство изделий')
ON CONFLICT DO NOTHING;

INSERT INTO subscription_plans (slug, name, role_scope, billing_period, price, currency, description, features, is_pro, is_active, sort_order)
VALUES
  (
    'worker-pro-monthly',
    'Worker PRO Monthly',
    'worker',
    'monthly',
    990,
    'KGS',
    'Для специалистов, которые хотят выше показываться в каталоге и быстрее получать отклики.',
    ARRAY[
      'PRO-значок в каталоге',
      'Приоритетное размещение среди исполнителей',
      'Подробная аналитика профиля',
      'Доступ к включенным сервисам поддержки'
    ],
    TRUE,
    TRUE,
    10
  ),
  (
    'worker-pro-quarterly',
    'Worker PRO Quarterly',
    'worker',
    'quarterly',
    2490,
    'KGS',
    'Расширенный тариф специалиста на квартал с экономией и приоритетным участием в выдаче.',
    ARRAY[
      'Все преимущества месячного PRO',
      'Больше доверия за счет длительного тарифа',
      'Приоритет на срочных заказах',
      'Включенные сервисы без доплаты'
    ],
    TRUE,
    TRUE,
    20
  ),
  (
    'customer-business-monthly',
    'Customer Business Monthly',
    'customer',
    'monthly',
    1190,
    'KGS',
    'Для заказчиков, которым нужен более быстрый подбор исполнителей и усиленное продвижение задач.',
    ARRAY[
      'Приоритетный показ новых заказов',
      'Быстрый подбор релевантных исполнителей',
      'Выделение срочных задач',
      'Доступ к включенным сервисам поддержки'
    ],
    TRUE,
    TRUE,
    30
  ),
  (
    'customer-business-quarterly',
    'Customer Business Quarterly',
    'customer',
    'quarterly',
    2990,
    'KGS',
    'Квартальный тариф для заказчиков с частыми публикациями и расширенной поддержкой.',
    ARRAY[
      'Все преимущества месячного Business',
      'Экономия на регулярных публикациях',
      'Помощь с оформлением задач',
      'Включенные сервисы без доплаты'
    ],
    TRUE,
    TRUE,
    40
  ),
  (
    'kyzmat-plus-yearly',
    'Kyzmat Plus Yearly',
    'all',
    'yearly',
    6990,
    'KGS',
    'Универсальная годовая подписка для активных пользователей платформы любого типа.',
    ARRAY[
      'Подходит и заказчику, и исполнителю',
      'Годовой PRO-статус',
      'Доступ к включенным сервисам',
      'Приоритетная поддержка платформы'
    ],
    TRUE,
    TRUE,
    50
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_services (slug, name, target_role, billing_type, price, currency, description, benefits, is_active, sort_order)
VALUES
  (
    'worker-profile-boost',
    'Поднятие профиля в каталоге на 7 дней',
    'worker',
    'one_time',
    790,
    'KGS',
    'Разово поднимает карточку специалиста в выдаче по городу и навыкам.',
    ARRAY[
      'Лучше заметность в каталоге',
      'Подходит для быстрого набора заказов',
      'Акцент на профиле специалиста'
    ],
    TRUE,
    10
  ),
  (
    'worker-priority-response',
    'Приоритетный отклик на заказ',
    'worker',
    'one_time',
    490,
    'KGS',
    'Помогает отклику исполнителя выделиться в карточке заказа.',
    ARRAY[
      'Выделение в списке откликов',
      'Хорошо для срочных задач',
      'Разовая покупка под конкретную заявку'
    ],
    TRUE,
    20
  ),
  (
    'customer-urgent-promo',
    'Продвижение срочного заказа',
    'customer',
    'one_time',
    690,
    'KGS',
    'Поднимает заказ в подборках и делает его заметнее для специалистов.',
    ARRAY[
      'Выше шанс получить отклики быстрее',
      'Подходит для срочных бытовых задач',
      'Разовая услуга без подписки'
    ],
    TRUE,
    30
  ),
  (
    'customer-shortlist',
    'Подбор 5 исполнителей менеджером',
    'customer',
    'one_time',
    990,
    'KGS',
    'Менеджер платформы формирует короткий список исполнителей под ваш заказ.',
    ARRAY[
      'Экономит время на подборе',
      'Хорошо для сложных или дорогих заказов',
      'Получаете готовый shortlist'
    ],
    TRUE,
    40
  ),
  (
    'priority-support',
    'Приоритетная поддержка платформы',
    'all',
    'subscription_included',
    0,
    'KGS',
    'Включенная сервисная опция для активной подписки: более быстрый ответ поддержки по спорным и рабочим вопросам.',
    ARRAY[
      'Доступно в активной подписке',
      'Ускоренная обработка обращений',
      'Для заказчика и исполнителя'
    ],
    TRUE,
    50
  ),
  (
    'safe-deal-check',
    'Проверка безопасной сделки',
    'all',
    'subscription_included',
    0,
    'KGS',
    'Включенная услуга: приоритетная проверка условий безопасной сделки и спорных деталей заказа.',
    ARRAY[
      'Доступно в активной подписке',
      'Помогает снизить риски сделки',
      'Подходит обеим сторонам'
    ],
    TRUE,
    60
  )
ON CONFLICT (slug) DO NOTHING;
