CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'report', 'task', 'note', 'ai')),
    author VARCHAR(255) NOT NULL,
    author_id VARCHAR(255),
    content TEXT NOT NULL,
    media JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    mentions JSONB DEFAULT '[]'::jsonb,
    patient_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_id ON chat_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
