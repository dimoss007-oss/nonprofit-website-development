ALTER TABLE psycho_sessions ADD COLUMN IF NOT EXISTS patient_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_psycho_sessions_patient ON psycho_sessions (patient_id) WHERE attached_strategy IS NOT NULL;