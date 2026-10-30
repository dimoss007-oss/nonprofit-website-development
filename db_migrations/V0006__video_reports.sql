CREATE TABLE IF NOT EXISTS video_reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'center_life',
  video_url TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  consent_obtained BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP,
  created_by VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_reports_pub ON video_reports (is_published, published_at DESC);