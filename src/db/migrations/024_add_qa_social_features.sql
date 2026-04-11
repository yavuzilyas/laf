-- Quora & Stack Overflow style social features for Q&A
-- Adds voting, tags, follows, best answers, and reputation

-- Tags system (like Stack Overflow)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Default blue color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS question_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, tag_id)
);

-- Question votes (upvote/downvote like Stack Overflow)
CREATE TABLE IF NOT EXISTS question_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Answer votes
CREATE TABLE IF NOT EXISTS answer_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_id, user_id)
);

-- Question follows (like Quora)
CREATE TABLE IF NOT EXISTS question_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Topic follows (like Quora)
CREATE TABLE IF NOT EXISTS topic_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES question_topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

-- Add new columns to questions
ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS follow_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS answer_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS accepted_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL;

-- Add vote_score to answers
ALTER TABLE answers 
    ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- Add reputation to users
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS qa_answer_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS qa_question_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_user_id ON question_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_answer_id ON answer_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_user_id ON answer_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_question_follows_question_id ON question_follows(question_id);
CREATE INDEX IF NOT EXISTS idx_question_follows_user_id ON question_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_topic_id ON topic_follows(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_user_id ON topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_vote_score ON questions(vote_score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_view_count ON questions(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_answers_vote_score ON answers(vote_score DESC);

-- Function to update question vote score
CREATE OR REPLACE FUNCTION update_question_vote_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE questions 
    SET vote_score = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM question_votes 
        WHERE question_id = COALESCE(NEW.question_id, OLD.question_id)
    )
    WHERE id = COALESCE(NEW.question_id, OLD.question_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_vote_score ON question_votes;
CREATE TRIGGER update_question_vote_score
    AFTER INSERT OR UPDATE OR DELETE ON question_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_question_vote_score();

-- Function to update answer vote score
CREATE OR REPLACE FUNCTION update_answer_vote_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE answers 
    SET vote_score = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM answer_votes 
        WHERE answer_id = COALESCE(NEW.answer_id, OLD.answer_id)
    )
    WHERE id = COALESCE(NEW.answer_id, OLD.answer_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_answer_vote_score ON answer_votes;
CREATE TRIGGER update_answer_vote_score
    AFTER INSERT OR UPDATE OR DELETE ON answer_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_answer_vote_score();

-- Function to update question follow count
CREATE OR REPLACE FUNCTION update_question_follow_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE questions SET follow_count = follow_count + 1 WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE questions SET follow_count = GREATEST(follow_count - 1, 0) WHERE id = OLD.question_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_follow_count ON question_follows;
CREATE TRIGGER update_question_follow_count
    AFTER INSERT OR DELETE ON question_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_question_follow_count();

-- Function to update answer count when answer is added/deleted
CREATE OR REPLACE FUNCTION update_question_answer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = OLD.question_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_answer_count ON answers;
CREATE TRIGGER update_question_answer_count
    AFTER INSERT OR DELETE ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_answer_count();

-- Function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
    reputation_change INTEGER;
BEGIN
    reputation_change := CASE
        WHEN TG_OP = 'INSERT' THEN NEW.vote_type * 10
        WHEN TG_OP = 'DELETE' THEN -OLD.vote_type * 10
        WHEN TG_OP = 'UPDATE' THEN (NEW.vote_type - OLD.vote_type) * 10
        ELSE 0
    END;
    
    IF TG_TABLE_NAME = 'question_votes' THEN
        UPDATE users SET reputation = reputation + reputation_change 
        WHERE id = (SELECT author_id FROM questions WHERE id = COALESCE(NEW.question_id, OLD.question_id));
    ELSIF TG_TABLE_NAME = 'answer_votes' THEN
        UPDATE users SET reputation = reputation + reputation_change 
        WHERE id = (SELECT author_id FROM answers WHERE id = COALESCE(NEW.answer_id, OLD.answer_id));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_reputation_question ON question_votes;
CREATE TRIGGER update_user_reputation_question
    AFTER INSERT OR UPDATE OR DELETE ON question_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reputation();

DROP TRIGGER IF EXISTS update_user_reputation_answer ON answer_votes;
CREATE TRIGGER update_user_reputation_answer
    AFTER INSERT OR UPDATE OR DELETE ON answer_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reputation();

-- Function to accept an answer (like Stack Overflow)
CREATE OR REPLACE FUNCTION accept_answer(p_answer_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_question_id UUID;
    v_question_author_id UUID;
BEGIN
    -- Get question info
    SELECT a.question_id, q.author_id 
    INTO v_question_id, v_question_author_id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.id = p_answer_id;
    
    -- Check if user is the question author
    IF v_question_author_id != p_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Unaccept previous answer if exists
    UPDATE answers SET is_accepted = FALSE 
    WHERE question_id = v_question_id AND is_accepted = TRUE;
    
    -- Accept new answer
    UPDATE answers SET is_accepted = TRUE WHERE id = p_answer_id;
    
    -- Update question
    UPDATE questions 
    SET accepted_answer_id = p_answer_id 
    WHERE id = v_question_id;
    
    -- Give reputation bonus to answer author (+15)
    UPDATE users SET reputation = reputation + 15 
    WHERE id = (SELECT author_id FROM answers WHERE id = p_answer_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
