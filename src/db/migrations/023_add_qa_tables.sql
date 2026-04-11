-- Questions and Answers (Q&A) tables
-- Supports public questions with moderation workflow

-- Question topics/categories
CREATE TABLE IF NOT EXISTS question_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default topics
INSERT INTO question_topics (name, slug, description, display_order) VALUES
    ('Ekonomi', 'economics', 'Ekonomi ve finans ile ilgili sorular', 1),
    ('Politika', 'politics', 'Politika ve güncel olaylar hakkında sorular', 2),
    ('Uluslararası İlişkiler', 'international-relations', 'Dünya politikası ve diplomatik konular', 3),
    ('Sosyoloji', 'sociology', 'Toplum ve sosyal bilimler hakkında sorular', 4),
    ('Tarih', 'history', 'Tarih ve geçmiş olaylar hakkında sorular', 5),
    ('Hukuk', 'law', 'Hukuk ve yasal konular hakkında sorular', 6),
    ('Tasarım', 'design', 'Tasarım ve sanat hakkında sorular', 7),
    ('Genel', 'general', 'Diğer konular hakkında sorular', 8)
ON CONFLICT (slug) DO NOTHING;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Question content (rich text from Edra editor)
    title VARCHAR(500) NOT NULL,
    content JSONB NOT NULL,
    content_html TEXT,
    
    -- Topic/category
    topic_id UUID REFERENCES question_topics(id) ON DELETE SET NULL,
    
    -- Author information (can be anonymous/guest)
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Status: pending (waiting for answer), answered, published, rejected
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'published', 'rejected')),
    
    -- Moderation tracking
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_note TEXT,
    
    -- Answer information
    answer_id UUID,
    answered_at TIMESTAMP WITH TIME ZONE,
    answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Answer content (rich text from Edra editor)
    content JSONB NOT NULL,
    content_html TEXT,
    
    -- Author (must be moderator or admin)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint after answers table exists
ALTER TABLE questions 
    ADD CONSTRAINT fk_question_answer 
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE SET NULL;

-- Indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_author_id ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_answer_id ON questions(answer_id);
CREATE INDEX IF NOT EXISTS idx_questions_answered_by ON questions(answered_by);

-- Indexes for answers
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author_id ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON answers(created_at DESC);

-- Trigger function to update questions updated_at
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for questions updated_at
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();

-- Trigger function to update answers updated_at
CREATE OR REPLACE FUNCTION update_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for answers updated_at
DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
CREATE TRIGGER update_answers_updated_at
    BEFORE UPDATE ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_answers_updated_at();

-- Function to auto-update question status when answer is added
CREATE OR REPLACE FUNCTION update_question_on_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the question status to answered and set answer_id
    UPDATE questions 
    SET 
        status = 'answered',
        answer_id = NEW.id,
        answered_at = NEW.created_at,
        answered_by = NEW.author_id
    WHERE id = NEW.question_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update question when answer is created
DROP TRIGGER IF EXISTS update_question_on_answer ON answers;
CREATE TRIGGER update_question_on_answer
    AFTER INSERT ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_on_answer();
