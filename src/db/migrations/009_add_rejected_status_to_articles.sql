-- Add 'rejected' status to articles table constraint

-- First, drop the existing constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_valid;

-- Add the updated constraint that includes 'rejected' status
ALTER TABLE articles 
ADD CONSTRAINT articles_status_valid 
CHECK (status IN ('draft', 'published', 'pending', 'archived', 'rejected'));
