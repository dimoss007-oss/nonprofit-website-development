CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.report_buffer (
    employee_id INTEGER NOT NULL,
    chat_id BIGINT NOT NULL,
    buffered_text TEXT NOT NULL,
    parts INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (employee_id, chat_id)
);