CREATE TABLE t_p59822815_nonprofit_website_de.sop_families (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    district VARCHAR(150),
    case_description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sop_families_district ON t_p59822815_nonprofit_website_de.sop_families(district);
CREATE INDEX idx_sop_families_status ON t_p59822815_nonprofit_website_de.sop_families(status);
