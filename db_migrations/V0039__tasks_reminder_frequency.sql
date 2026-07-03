ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reminder_frequency VARCHAR(20) NULL CHECK (reminder_frequency IN ('daily','weekly','monthly')),
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ NULL;