ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS care_stage_since DATE;

UPDATE patients SET care_stage_since = updated_at::date WHERE care_stage = 'posttreatment' AND care_stage_since IS NULL;