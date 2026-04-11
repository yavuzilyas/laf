-- Add like/dislike columns to answers table
ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;

-- Create index for faster sorting by likes
CREATE INDEX IF NOT EXISTS idx_answers_like_count ON answers(like_count DESC);

-- Create answer_reactions table for tracking user reactions
CREATE TABLE IF NOT EXISTS answer_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(answer_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_answer_reactions_answer ON answer_reactions(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_reactions_user ON answer_reactions(user_id);

-- Function to update answer like/dislike counts
CREATE OR REPLACE FUNCTION update_answer_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update like_count
    UPDATE answers 
    SET like_count = (
        SELECT COUNT(*) FROM answer_reactions 
        WHERE answer_id = COALESCE(NEW.answer_id, OLD.answer_id) 
        AND reaction_type = 'like'
    ),
    dislike_count = (
        SELECT COUNT(*) FROM answer_reactions 
        WHERE answer_id = COALESCE(NEW.answer_id, OLD.answer_id) 
        AND reaction_type = 'dislike'
    )
    WHERE id = COALESCE(NEW.answer_id, OLD.answer_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update counts
DROP TRIGGER IF EXISTS update_answer_counts_on_reaction ON answer_reactions;
CREATE TRIGGER update_answer_counts_on_reaction
    AFTER INSERT OR UPDATE OR DELETE ON answer_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_answer_reaction_counts();
