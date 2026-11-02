ALTER TABLE brigade_stats ADD COLUMN IF NOT EXISTS districts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE brigade_stats ADD COLUMN IF NOT EXISTS settlements INTEGER NOT NULL DEFAULT 0;
ALTER TABLE brigade_stats ADD COLUMN IF NOT EXISTS parcels INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS brigade_trips (
  id SERIAL PRIMARY KEY,
  district VARCHAR(80) NOT NULL,
  lat NUMERIC(8,4) NOT NULL,
  lon NUMERIC(8,4) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  trip_date DATE,
  consent_obtained BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_requests (
  id SERIAL PRIMARY KEY,
  company VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  interest VARCHAR(40) NOT NULL DEFAULT 'trips',
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE brigade_actions ADD COLUMN IF NOT EXISTS result_text VARCHAR(200) NOT NULL DEFAULT '';
UPDATE brigade_actions SET result_text = 'Бригада доедет до семей в отдалённых районах' WHERE id = 1 AND result_text = '';
UPDATE brigade_actions SET result_text = 'Семья получит продуктовый набор' WHERE id = 2 AND result_text = '';
UPDATE brigade_actions SET result_text = 'Час профессиональной психологической помощи на выезде' WHERE id = 3 AND result_text = '';