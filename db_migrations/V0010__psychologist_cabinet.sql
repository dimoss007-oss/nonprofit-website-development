ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'user', 'psychologist'));
CREATE TABLE IF NOT EXISTS psycho_sessions (
  id TEXT PRIMARY KEY,
  author_login VARCHAR(100) NOT NULL,
  session_date DATE NOT NULL,
  client_id INTEGER,
  client_name VARCHAR(200) NOT NULL DEFAULT '',
  request TEXT NOT NULL DEFAULT '',
  phenomenology TEXT NOT NULL DEFAULT '',
  contact_interruptions TEXT NOT NULL DEFAULT '',
  client_feelings TEXT NOT NULL DEFAULT '',
  client_background TEXT NOT NULL DEFAULT '',
  client_figure TEXT NOT NULL DEFAULT '',
  therapist_feelings TEXT NOT NULL DEFAULT '',
  ai_consultant_strategy TEXT,
  ai_supervision TEXT,
  attached_strategy TEXT,
  attached_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_psycho_sessions_author ON psycho_sessions (author_login, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_psycho_sessions_client ON psycho_sessions (client_id) WHERE attached_strategy IS NOT NULL;