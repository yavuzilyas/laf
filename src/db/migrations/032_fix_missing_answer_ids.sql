-- Fix questions that have answers but missing answer_id
-- This ensures the main QA page shows answers correctly

-- Update questions that have at least one answer but null answer_id
-- Set answer_id to the most recent answer for each question
UPDATE questions q
SET 
    answer_id = latest_answer.id,
    answered_at = latest_answer.created_at,
    answered_by = latest_answer.author_id,
    status = CASE 
        WHEN q.status = 'pending' THEN 'answered'
        ELSE q.status
    END
FROM (
    SELECT DISTINCT ON (question_id)
        id,
        question_id,
        created_at,
        author_id
    FROM answers
    ORDER BY question_id, created_at DESC
) latest_answer
WHERE q.id = latest_answer.question_id
  AND q.answer_id IS NULL;

-- Also update answer_count to match actual answer count
UPDATE questions q
SET answer_count = COALESCE(answer_counts.count, 0)
FROM (
    SELECT question_id, COUNT(*) as count
    FROM answers
    GROUP BY question_id
) answer_counts
WHERE q.id = answer_counts.question_id;
