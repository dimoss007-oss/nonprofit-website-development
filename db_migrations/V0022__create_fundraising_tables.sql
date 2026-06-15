
-- Организации-доноры
CREATE TABLE donors_orgs (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  manager       TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Частные жертвователи
CREATE TABLE donors_persons (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  source        TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- История пожертвований (общая для обоих типов)
CREATE TABLE donor_donations (
  id            SERIAL PRIMARY KEY,
  donor_type    TEXT NOT NULL CHECK (donor_type IN ('org', 'person')),
  donor_id      INTEGER NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  donated_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donor_donations_type_id ON donor_donations (donor_type, donor_id);
