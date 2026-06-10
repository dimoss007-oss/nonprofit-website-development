CREATE TABLE t_p59822815_nonprofit_website_de.patient_children (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES t_p59822815_nonprofit_website_de.patients(id),
  last_name VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);