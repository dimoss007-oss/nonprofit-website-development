CREATE TABLE IF NOT EXISTS child_weekly_reports (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES patient_children(id),
  author VARCHAR(255),
  week_start DATE NOT NULL,
  report_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_weekly_reports_child ON child_weekly_reports (child_id, week_start DESC);