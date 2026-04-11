-- Add report_count column to questions table for QA reporting

ALTER TABLE questions ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Create index for efficient querying of reported questions
CREATE INDEX IF NOT EXISTS idx_questions_report_count ON questions(report_count) WHERE report_count > 0;
