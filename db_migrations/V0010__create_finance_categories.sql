CREATE TABLE t_p59822815_nonprofit_website_de.finance_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP DEFAULT now()
);