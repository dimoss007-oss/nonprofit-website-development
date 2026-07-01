CREATE TABLE IF NOT EXISTS gov_agency_contacts (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES gov_agencies(id),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);