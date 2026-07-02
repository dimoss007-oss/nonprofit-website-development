ALTER TABLE t_p59822815_nonprofit_website_de.gov_agencies
ADD COLUMN IF NOT EXISTS agreement_status VARCHAR(20) NULL DEFAULT NULL;

COMMENT ON COLUMN t_p59822815_nonprofit_website_de.gov_agencies.agreement_status IS 'sent | signed | rejected';