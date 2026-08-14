CREATE TABLE IF NOT EXISTS patient_daily_reports (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    author VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
    anxiety SMALLINT NOT NULL CHECK (anxiety BETWEEN 1 AND 5),
    sleep SMALLINT NOT NULL CHECK (sleep BETWEEN 1 AND 5),
    appetite SMALLINT NOT NULL CHECK (appetite BETWEEN 1 AND 5),
    social_activity SMALLINT NOT NULL CHECK (social_activity BETWEEN 1 AND 5),
    aggression SMALLINT NOT NULL CHECK (aggression BETWEEN 1 AND 5),
    notes TEXT,
    risk_markers JSONB DEFAULT '[]'::jsonb,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (risk_level IN ('none','attention','high')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(patient_id, report_date, author)
);

CREATE INDEX IF NOT EXISTS idx_patient_daily_reports_patient_id ON patient_daily_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_daily_reports_date ON patient_daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_patient_daily_reports_risk_level ON patient_daily_reports(risk_level);