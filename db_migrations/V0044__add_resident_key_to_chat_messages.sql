ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS resident_key VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_chat_messages_resident_key ON chat_messages(resident_key);