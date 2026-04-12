-- Check answers with null author_id
SELECT 
    a.id as answer_id,
    a.question_id,
    a.author_id,
    a.content->>'text' as content_preview,
    a.created_at,
    q.title as question_title
FROM answers a
LEFT JOIN questions q ON a.question_id = q.id
WHERE a.author_id IS NULL;

-- Check answers with valid author_id (for comparison)
SELECT 
    COUNT(*) as total_answers,
    COUNT(author_id) as answers_with_author,
    COUNT(*) - COUNT(author_id) as answers_without_author
FROM answers;

-- Update answers that have null author_id but have a matching question with answered_by
-- This fixes historical data where author_id wasn't set properly
UPDATE answers 
SET author_id = q.answered_by
FROM questions q
WHERE answers.question_id = q.id 
  AND answers.author_id IS NULL 
  AND q.answered_by IS NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_answers,
    COUNT(author_id) as answers_with_author,
    COUNT(*) - COUNT(author_id) as answers_without_author
FROM answers;
