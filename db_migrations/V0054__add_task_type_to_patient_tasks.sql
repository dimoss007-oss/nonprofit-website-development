ALTER TABLE patient_tasks
  ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) NOT NULL DEFAULT 'main';

CREATE INDEX IF NOT EXISTS idx_patient_tasks_type ON patient_tasks(task_type);