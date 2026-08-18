CREATE TABLE IF NOT EXISTS patient_ai_summaries (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    summary_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_ai_summaries_patient_id ON patient_ai_summaries(patient_id);