CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.ai_daily_summaries (
    summary_date DATE PRIMARY KEY,
    summary_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);