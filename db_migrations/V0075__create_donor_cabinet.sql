ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_code VARCHAR(16);
CREATE INDEX IF NOT EXISTS idx_orders_referrer ON orders (referrer_code) WHERE referrer_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_email_lower ON orders (lower(user_email));

CREATE TABLE IF NOT EXISTS donor_accounts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  display_name TEXT,
  address TEXT,
  referral_code VARCHAR(16) NOT NULL UNIQUE,
  show_in_rating BOOLEAN NOT NULL DEFAULT TRUE,
  email_unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
  linked_person_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS donor_login_codes (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  ip TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_donor_codes_email ON donor_login_codes (email, created_at DESC);

CREATE TABLE IF NOT EXISTS donor_sessions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_levels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'Heart',
  color TEXT NOT NULL DEFAULT 'rose',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS donor_achievements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Award',
  color TEXT NOT NULL DEFAULT 'amber',
  kind TEXT NOT NULL CHECK (kind IN ('first_donation','total_amount','donation_count','monthly_streak','anniversary_years','manual')),
  threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  reward_message TEXT,
  certificate BOOLEAN NOT NULL DEFAULT FALSE,
  gift_title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_awards (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  achievement_id INTEGER NOT NULL REFERENCES donor_achievements(id),
  source TEXT NOT NULL DEFAULT 'auto',
  note TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS donor_messages (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  broadcast_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'broadcast',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_donor_messages_account ON donor_messages (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS donor_broadcasts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  level_id INTEGER,
  in_cabinet BOOLEAN NOT NULL DEFAULT TRUE,
  by_email BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_email_queue (
  id SERIAL PRIMARY KEY,
  broadcast_id INTEGER,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_donor_email_queue_status ON donor_email_queue (status, id);

CREATE TABLE IF NOT EXISTS donor_gifts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  achievement_id INTEGER REFERENCES donor_achievements(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS donor_feed (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_impact_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Heart',
  unit_label TEXT NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS donor_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  org_name TEXT NOT NULL DEFAULT 'АНО «Спасение надежды»',
  org_inn TEXT,
  org_ogrn TEXT,
  org_address TEXT,
  org_signer TEXT,
  org_signer_post TEXT,
  site_url TEXT NOT NULL DEFAULT 'https://спасениенадежды.рф',
  lapsed_days INTEGER NOT NULL DEFAULT 60,
  reminder_cooldown_days INTEGER NOT NULL DEFAULT 90
);
INSERT INTO donor_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS donor_automation_log (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES donor_accounts(id),
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, kind, ref)
);

INSERT INTO donor_levels (title, description, min_amount, icon, color, sort_order) VALUES
 ('Друг', 'Вы сделали первый шаг, спасибо!', 1, 'Heart', 'rose', 1),
 ('Опекун', 'Ваша поддержка уже стала заметной для наших семей', 5000, 'HandHeart', 'amber', 2),
 ('Хранитель надежды', 'Благодаря вам семьи уверенно смотрят в будущее', 25000, 'Shield', 'sky', 3),
 ('Ангел-хранитель', 'Вы одна из главных опор центра', 100000, 'Crown', 'violet', 4);

INSERT INTO donor_achievements (title, description, icon, color, kind, threshold, reward_message, certificate, gift_title, sort_order) VALUES
 ('Первый шаг', 'Вы впервые помогли семьям в центре', 'Sprout', 'emerald', 'first_donation', 1, 'Спасибо, что сделали первый шаг! Ваша помощь уже работает: она превращается в тёплый ужин, одежду и поддержку психолога для мам и детей.', false, NULL, 1),
 ('Тысяча добра', 'Пожертвования достигли 1 000 ₽', 'Coins', 'amber', 'total_amount', 1000, NULL, false, NULL, 2),
 ('Пять тысяч тепла', 'Пожертвования достигли 5 000 ₽', 'Flame', 'rose', 'total_amount', 5000, 'Вы подарили нашим семьям настоящее тепло. Спасибо за вашу доброту!', true, NULL, 3),
 ('Десять тысяч надежды', 'Пожертвования достигли 10 000 ₽', 'Star', 'sky', 'total_amount', 10000, 'Дети и мамы центра благодарят вас от всего сердца. Мы хотим отправить вам открытку с рисунком детей.', true, 'Открытка с рисунком детей', 4),
 ('Опора центра', 'Пожертвования достигли 50 000 ₽', 'Trophy', 'violet', 'total_amount', 50000, 'Ваша поддержка меняет жизни. Спасибо, что вы рядом с нами!', true, NULL, 5),
 ('Верный друг', 'Три пожертвования', 'Heart', 'rose', 'donation_count', 3, NULL, false, NULL, 6),
 ('Десять добрых дел', 'Десять пожертвований', 'Sparkles', 'amber', 'donation_count', 10, NULL, false, NULL, 7),
 ('Двадцать пять добрых дел', 'Двадцать пять пожертвований', 'Medal', 'violet', 'donation_count', 25, NULL, true, NULL, 8),
 ('Три месяца вместе', 'Помощь три месяца подряд', 'CalendarCheck', 'sky', 'monthly_streak', 3, NULL, false, NULL, 9),
 ('Полгода рядом', 'Помощь шесть месяцев подряд', 'CalendarCheck', 'emerald', 'monthly_streak', 6, NULL, false, NULL, 10),
 ('Год подряд', 'Помощь двенадцать месяцев подряд', 'Crown', 'amber', 'monthly_streak', 12, 'Целый год вы помогаете каждый месяц. Это дорогого стоит. Спасибо!', true, NULL, 11),
 ('Год с нами', 'С первого пожертвования прошёл год', 'Cake', 'rose', 'anniversary_years', 1, NULL, false, NULL, 12),
 ('Два года с нами', 'С первого пожертвования прошло два года', 'Cake', 'violet', 'anniversary_years', 2, NULL, true, NULL, 13),
 ('Волонтёр', 'Помогал центру делом. Выдаётся администратором', 'Users', 'emerald', 'manual', 0, NULL, false, NULL, 14),
 ('Партнёр года', 'Особая награда от центра. Выдаётся администратором', 'Award', 'amber', 'manual', 0, NULL, true, NULL, 15);

INSERT INTO donor_impact_items (title, icon, unit_label, unit_cost, sort_order) VALUES
 ('Питание', 'UtensilsCrossed', 'дней питания для семьи', 300, 1),
 ('Одежда и вещи', 'Shirt', 'комплектов одежды и гигиены', 500, 2),
 ('Юридическая помощь', 'Scale', 'юридических консультаций', 1000, 3),
 ('Психолог', 'HeartHandshake', 'сессий с психологом', 2000, 4),
 ('Детские нужды', 'Baby', 'наборов для детей', 500, 5),
 ('Содержание центра', 'Home', 'платежей за содержание центра', 3000, 6);