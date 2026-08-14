ALTER TABLE patient_daily_reports
  ADD COLUMN IF NOT EXISTS problems_identified TEXT,
  ADD COLUMN IF NOT EXISTS actions_taken TEXT,
  ADD COLUMN IF NOT EXISTS results TEXT;