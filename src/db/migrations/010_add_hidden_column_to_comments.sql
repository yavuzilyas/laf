-- Add hidden column to comments table

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Add index for hidden column
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments(hidden);
