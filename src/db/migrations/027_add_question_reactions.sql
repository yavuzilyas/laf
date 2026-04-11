-- Add like/dislike columns to questions table
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;

-- Create index for faster sorting by likes
CREATE INDEX IF NOT EXISTS idx_questions_like_count ON questions(like_count DESC);

-- Create question_reactions table for tracking user reactions
CREATE TABLE IF NOT EXISTS question_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_reactions_question ON question_reactions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reactions_user ON question_reactions(user_id);

-- Migrate existing vote data to new like_count (approximate conversion)
-- This preserves the net score as likes (positive votes become likes)
UPDATE questions
SET like_count = GREATEST(0, vote_score)
WHERE vote_score > 0;

-- Update timestamps
UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE like_count > 0 OR dislike_count > 0;
