CREATE TABLE t_p59822815_nonprofit_website_de.contact_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  subject VARCHAR(300),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);