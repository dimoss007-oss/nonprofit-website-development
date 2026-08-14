ALTER TABLE patient_daily_reports
  ADD COLUMN IF NOT EXISTS overall_state SMALLINT;

ALTER TABLE patient_daily_reports
  ADD CONSTRAINT chk_overall_state CHECK (overall_state BETWEEN 0 AND 10);