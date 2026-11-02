CREATE TABLE IF NOT EXISTS admin_login_log (
  id BIGSERIAL PRIMARY KEY,
  login VARCHAR(100) NOT NULL,
  full_name VARCHAR(200),
  method VARCHAR(20) NOT NULL DEFAULT 'password',
  success BOOLEAN NOT NULL,
  ip VARCHAR(64),
  user_agent VARCHAR(300),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_created ON admin_login_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_login ON admin_login_log (login, created_at DESC);

CREATE TABLE IF NOT EXISTS staff_login_codes (
  user_id INTEGER PRIMARY KEY,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_user ON staff_sessions (user_id);