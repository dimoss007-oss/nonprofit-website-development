ALTER TABLE gov_agencies ADD COLUMN contact_status VARCHAR(20) DEFAULT NULL;
UPDATE gov_agencies SET contact_status = 'has_contact' WHERE has_contact = TRUE;