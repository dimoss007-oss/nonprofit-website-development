CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.password_resets (
    user_id INTEGER PRIMARY KEY,
    code_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);