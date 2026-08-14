ALTER TABLE patient_daily_reports
  ADD COLUMN IF NOT EXISTS contact_children SMALLINT,
  ADD COLUMN IF NOT EXISTS contact_surroundings SMALLINT,
  ADD COLUMN IF NOT EXISTS contact_staff SMALLINT,
  ADD COLUMN IF NOT EXISTS engagement_level SMALLINT,
  ADD COLUMN IF NOT EXISTS negative_behavior_level SMALLINT,
  ADD COLUMN IF NOT EXISTS positive_thinking_level SMALLINT,
  ADD COLUMN IF NOT EXISTS tasks_completion SMALLINT,
  ADD COLUMN IF NOT EXISTS feelings_diary_usage SMALLINT,
  ADD COLUMN IF NOT EXISTS self_analysis_usage SMALLINT;

ALTER TABLE patient_daily_reports
  ADD CONSTRAINT chk_contact_children CHECK (contact_children BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_contact_surroundings CHECK (contact_surroundings BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_contact_staff CHECK (contact_staff BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_engagement_level CHECK (engagement_level BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_negative_behavior_level CHECK (negative_behavior_level BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_positive_thinking_level CHECK (positive_thinking_level BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_tasks_completion CHECK (tasks_completion BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_feelings_diary_usage CHECK (feelings_diary_usage BETWEEN 0 AND 10),
  ADD CONSTRAINT chk_self_analysis_usage CHECK (self_analysis_usage BETWEEN 0 AND 10);

ALTER TABLE patient_daily_reports ALTER COLUMN mood SET DEFAULT 0;
ALTER TABLE patient_daily_reports ALTER COLUMN anxiety SET DEFAULT 0;
ALTER TABLE patient_daily_reports ALTER COLUMN sleep SET DEFAULT 0;
ALTER TABLE patient_daily_reports ALTER COLUMN appetite SET DEFAULT 0;
ALTER TABLE patient_daily_reports ALTER COLUMN social_activity SET DEFAULT 0;
ALTER TABLE patient_daily_reports ALTER COLUMN aggression SET DEFAULT 0;