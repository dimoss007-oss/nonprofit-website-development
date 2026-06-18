
CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.funnel_donors (
  id serial PRIMARY KEY,
  name text NOT NULL,
  donor_type text NOT NULL DEFAULT 'org',
  donor_category text NOT NULL DEFAULT 'donation',
  stage text NOT NULL DEFAULT 'identified',
  stage_order integer NOT NULL DEFAULT 1,
  contact_person text NULL,
  phone text NULL,
  email text NULL,
  potential_amount numeric(12,2) NULL,
  notes text NULL,
  manager text NULL,
  last_action_at date NULL,
  next_action_at date NULL,
  next_action_note text NULL,
  linked_org_id integer NULL,
  linked_person_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_donors_stage
  ON t_p59822815_nonprofit_website_de.funnel_donors(stage);
