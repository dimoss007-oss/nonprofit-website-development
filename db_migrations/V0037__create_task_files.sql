CREATE TABLE t_p59822815_nonprofit_website_de.task_files (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES t_p59822815_nonprofit_website_de.tasks(id),
  filename    VARCHAR(500) NOT NULL,
  url         TEXT NOT NULL,
  size        INTEGER NULL,
  uploaded_by VARCHAR(100) NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  archived    BOOLEAN NOT NULL DEFAULT false
);