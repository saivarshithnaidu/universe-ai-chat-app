-- Add share functionality columns to chats table
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS share_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_chats_share_token ON chats (share_token)
WHERE
    share_token IS NOT NULL;