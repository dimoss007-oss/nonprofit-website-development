CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  contract_number VARCHAR(50) NOT NULL,
  contract_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts (contract_date);
CREATE INDEX IF NOT EXISTS idx_contracts_patient ON contracts (patient_id);