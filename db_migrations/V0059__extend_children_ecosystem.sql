-- Расширение сущности "Дети пациентов" до самостоятельных субъектов реабилитации

ALTER TABLE patient_children
    ADD COLUMN IF NOT EXISTS previous_education VARCHAR(255),
    ADD COLUMN IF NOT EXISTS current_education VARCHAR(255),
    ADD COLUMN IF NOT EXISTS extracurriculars VARCHAR(255);

CREATE TABLE IF NOT EXISTS child_daily_reports (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES patient_children(id),
    author VARCHAR(255),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scale_emotional SMALLINT CHECK (scale_emotional BETWEEN 1 AND 10),
    scale_stress SMALLINT CHECK (scale_stress BETWEEN 1 AND 10),
    scale_sociability SMALLINT CHECK (scale_sociability BETWEEN 1 AND 10),
    scale_activity SMALLINT CHECK (scale_activity BETWEEN 1 AND 10),
    scale_contact_mother SMALLINT CHECK (scale_contact_mother BETWEEN 1 AND 10),
    scale_contact_peers SMALLINT CHECK (scale_contact_peers BETWEEN 1 AND 10),
    scale_academic SMALLINT CHECK (scale_academic BETWEEN 1 AND 10),
    scale_work SMALLINT CHECK (scale_work BETWEEN 1 AND 10),
    scale_attention SMALLINT CHECK (scale_attention BETWEEN 1 AND 10),
    scale_discipline SMALLINT CHECK (scale_discipline BETWEEN 1 AND 10),
    identified_problems TEXT,
    taken_actions TEXT,
    results TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_daily_reports_child_id ON child_daily_reports(child_id);

CREATE TABLE IF NOT EXISTS child_tasks (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES patient_children(id),
    description TEXT NOT NULL,
    task_type VARCHAR(20) NOT NULL DEFAULT 'main',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deadline DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_tasks_child_id ON child_tasks(child_id);

CREATE TABLE IF NOT EXISTS child_ai_summaries (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES patient_children(id),
    summary_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_ai_summaries_child_id ON child_ai_summaries(child_id);