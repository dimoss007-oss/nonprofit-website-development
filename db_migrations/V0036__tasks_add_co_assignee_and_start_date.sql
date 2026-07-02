ALTER TABLE t_p59822815_nonprofit_website_de.tasks
  ADD COLUMN IF NOT EXISTS co_assignee_login VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS co_assignee_name  VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS start_date        DATE         NULL;