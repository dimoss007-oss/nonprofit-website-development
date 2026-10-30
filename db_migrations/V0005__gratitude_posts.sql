CREATE TABLE IF NOT EXISTS gratitude_posts (
  id SERIAL PRIMARY KEY,
  post_type VARCHAR(20) NOT NULL DEFAULT 'drawing',
  media_url TEXT,
  caption TEXT NOT NULL DEFAULT '',
  letter_text TEXT,
  consent_obtained BOOLEAN NOT NULL DEFAULT FALSE,
  goal_id INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gratitude_published ON gratitude_posts (is_published, published_at DESC);