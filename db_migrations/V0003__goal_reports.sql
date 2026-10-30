CREATE TABLE IF NOT EXISTS goal_reports (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL UNIQUE,
  situation_before TEXT NOT NULL DEFAULT '',
  action_taken TEXT NOT NULL DEFAULT '',
  situation_after TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  ai_text TEXT,
  sent_at TIMESTAMP,
  sent_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE donor_email_queue ADD COLUMN IF NOT EXISTS body_html TEXT;