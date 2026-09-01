ALTER TABLE t_p59822815_nonprofit_website_de.patient_daily_reports
  ADD COLUMN IF NOT EXISTS employee_id INTEGER NULL REFERENCES t_p59822815_nonprofit_website_de.admin_users(id);