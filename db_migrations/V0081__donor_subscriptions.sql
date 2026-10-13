CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.donor_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL DEFAULT 'Аноним',
    amount NUMERIC(10,2) NOT NULL,
    payment_method_id VARCHAR(100) NOT NULL,
    first_payment_id VARCHAR(100) NOT NULL UNIQUE,
    card_last4 VARCHAR(4),
    card_type VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    next_charge_at TIMESTAMP NOT NULL,
    last_charge_at TIMESTAMP,
    fail_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    referrer_code VARCHAR(16),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_donor_subscriptions_email ON t_p59822815_nonprofit_website_de.donor_subscriptions (lower(email));
CREATE INDEX IF NOT EXISTS idx_donor_subscriptions_due ON t_p59822815_nonprofit_website_de.donor_subscriptions (status, next_charge_at);