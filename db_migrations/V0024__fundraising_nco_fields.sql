
-- Категория донора (тип финансирования)
ALTER TABLE t_p59822815_nonprofit_website_de.donors_orgs
  ADD COLUMN IF NOT EXISTS donor_category text NOT NULL DEFAULT 'donation',
  ADD COLUMN IF NOT EXISTS inn text NULL,
  ADD COLUMN IF NOT EXISTS contact_person text NULL;

ALTER TABLE t_p59822815_nonprofit_website_de.donors_persons
  ADD COLUMN IF NOT EXISTS donor_category text NOT NULL DEFAULT 'donation';

-- Тип пожертвования и цель в записи о пожертвовании
ALTER TABLE t_p59822815_nonprofit_website_de.donor_donations
  ADD COLUMN IF NOT EXISTS donation_type text NOT NULL DEFAULT 'money',
  ADD COLUMN IF NOT EXISTS goal_id integer NULL,
  ADD COLUMN IF NOT EXISTS thank_you_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at timestamp with time zone NULL;

-- Цели сбора
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.fundraising_goals (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NULL,
  target_amount numeric(12,2) NOT NULL,
  collected_amount numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Стартовые цели
INSERT INTO t_p59822815_nonprofit_website_de.fundraising_goals (title, description, target_amount, sort_order) VALUES
  ('Питание', 'Продукты питания для женщин и детей в центре', 50000, 1),
  ('Вещи и гигиена', 'Одежда, обувь, средства гигиены', 30000, 2),
  ('Юридическая помощь', 'Оплата услуг юриста, госпошлины', 25000, 3),
  ('Психологическая помощь', 'Сессии с психологом, арт-терапия', 20000, 4);
