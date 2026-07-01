CREATE TABLE IF NOT EXISTS gov_agencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  service_phone TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gov_agency_documents (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES gov_agencies(id),
  title TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  doc_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);