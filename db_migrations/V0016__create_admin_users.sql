CREATE TABLE t_p59822815_nonprofit_website_de.admin_users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);