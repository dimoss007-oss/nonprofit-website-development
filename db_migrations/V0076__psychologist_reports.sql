CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.psychologist_reports (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    employee_id INTEGER,
    author VARCHAR(200),
    report_date DATE NOT NULL,
    report_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (patient_id, report_date, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_psych_reports_patient ON t_p59822815_nonprofit_website_de.psychologist_reports (patient_id, report_date DESC);