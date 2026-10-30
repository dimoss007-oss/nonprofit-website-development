ALTER TABLE goal_reports ADD COLUMN IF NOT EXISTS tag VARCHAR(30) NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS brigade_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  period_label VARCHAR(60) NOT NULL DEFAULT '',
  trips INTEGER NOT NULL DEFAULT 0,
  families INTEGER NOT NULL DEFAULT 0,
  km INTEGER NOT NULL DEFAULT 0,
  map_url TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO brigade_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS brigade_actions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 500,
  goal_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO brigade_actions (title, amount, sort_order) VALUES
 ('Оплатить бак бензина', 3000, 1),
 ('Собрать продуктовый набор для выезда', 1500, 2),
 ('Оплатить час работы психолога в полях', 2000, 3);