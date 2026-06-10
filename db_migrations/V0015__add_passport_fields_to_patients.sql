ALTER TABLE t_p59822815_nonprofit_website_de.patients
  ADD COLUMN passport_series VARCHAR(10),
  ADD COLUMN passport_number VARCHAR(20),
  ADD COLUMN passport_issued_date DATE,
  ADD COLUMN passport_issued_by TEXT;