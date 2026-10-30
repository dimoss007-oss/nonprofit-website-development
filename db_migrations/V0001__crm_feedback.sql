CREATE TABLE IF NOT EXISTS crm_feedback (
  id SERIAL PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_login TEXT,
  category TEXT NOT NULL DEFAULT 'idea',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);