ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS care_stage VARCHAR(20) NOT NULL DEFAULT 'inpatient';

ALTER TABLE patients
  ADD CONSTRAINT chk_patients_care_stage CHECK (care_stage IN ('inpatient', 'posttreatment'));

CREATE INDEX IF NOT EXISTS idx_patients_care_stage ON patients(care_stage);