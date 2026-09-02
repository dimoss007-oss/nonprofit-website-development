ALTER TABLE t_p59822815_nonprofit_website_de.patient_ai_summaries
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'rule_based';