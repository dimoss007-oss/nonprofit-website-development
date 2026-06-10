CREATE TABLE t_p59822815_nonprofit_website_de.patient_documents (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES t_p59822815_nonprofit_website_de.patients(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);