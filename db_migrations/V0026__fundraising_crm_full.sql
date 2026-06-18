
-- История взаимодействий с донором
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.donor_interactions (
  id serial PRIMARY KEY,
  donor_type text NOT NULL,
  donor_id integer NOT NULL,
  interaction_type text NOT NULL DEFAULT 'comment',
  title text NULL,
  description text NOT NULL DEFAULT '',
  interaction_date date NOT NULL DEFAULT CURRENT_DATE,
  manager text NULL,
  outcome text NULL,
  next_step text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donor_interactions_donor
  ON t_p59822815_nonprofit_website_de.donor_interactions(donor_type, donor_id);

-- Кампании по сбору средств
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.fundraising_campaigns (
  id serial PRIMARY KEY,
  title text NOT NULL,
  goal text NULL,
  budget numeric(12,2) NULL,
  start_date date NULL,
  end_date date NULL,
  audience text NULL,
  channel text NULL,
  status text NOT NULL DEFAULT 'planned',
  result_amount numeric(12,2) NULL DEFAULT 0,
  result_donors integer NULL DEFAULT 0,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Проекты организации
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.org_projects (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NULL,
  start_date date NULL,
  end_date date NULL,
  budget numeric(12,2) NULL,
  status text NOT NULL DEFAULT 'active',
  result text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Связь: проект ↔ донор
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.project_donors (
  id serial PRIMARY KEY,
  project_id integer NOT NULL,
  donor_type text NOT NULL,
  donor_id integer NOT NULL,
  amount numeric(12,2) NULL,
  notes text NULL
);

-- Документы (договоры, письма, отчёты, презентации, шаблоны)
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.donor_documents (
  id serial PRIMARY KEY,
  donor_type text NULL,
  donor_id integer NULL,
  campaign_id integer NULL,
  project_id integer NULL,
  doc_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  url text NULL,
  notes text NULL,
  doc_date date NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Задачи и напоминания (привязаны к донору)
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.donor_tasks (
  id serial PRIMARY KEY,
  donor_type text NULL,
  donor_id integer NULL,
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'call',
  due_date date NULL,
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamp with time zone NULL,
  manager text NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donor_tasks_donor
  ON t_p59822815_nonprofit_website_de.donor_tasks(donor_type, donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_tasks_due
  ON t_p59822815_nonprofit_website_de.donor_tasks(due_date) WHERE is_done = false;

-- Метрики отношений с донором
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.donor_metrics (
  id serial PRIMARY KEY,
  donor_type text NOT NULL,
  donor_id integer NOT NULL UNIQUE,
  engagement_level integer NOT NULL DEFAULT 3 CHECK (engagement_level BETWEEN 1 AND 5),
  support_probability integer NOT NULL DEFAULT 50 CHECK (support_probability BETWEEN 0 AND 100),
  interests text NULL,
  last_contact_at date NULL,
  next_step text NULL,
  next_step_date date NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (donor_type, donor_id)
);

-- Расширяем donor_donations: назначение платежа, проект, регулярное
ALTER TABLE t_p59822815_nonprofit_website_de.donor_donations
  ADD COLUMN IF NOT EXISTS payment_purpose text NULL,
  ADD COLUMN IF NOT EXISTS project_id integer NULL,
  ADD COLUMN IF NOT EXISTS is_regular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_url text NULL;

-- Стартовые данные кампаний
INSERT INTO t_p59822815_nonprofit_website_de.fundraising_campaigns (title, goal, status, channel)
VALUES
  ('Год без насилия 2025', 'Привлечение новых доноров через социальные сети', 'active', 'Соцсети'),
  ('Письмо благодарности (email)', 'Удержание текущих доноров', 'planned', 'Email');
