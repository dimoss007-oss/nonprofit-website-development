CREATE TABLE IF NOT EXISTS patient_tasks (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    description TEXT NOT NULL,
    deadline TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_tasks_patient_id ON patient_tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tasks_status ON patient_tasks(status);