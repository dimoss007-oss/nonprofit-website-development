CREATE TABLE t_p59822815_nonprofit_website_de.max_contact_subscribers (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);