-- Add updated_at column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for updated_at column
CREATE INDEX IF NOT EXISTS idx_notifications_updated_at ON notifications(updated_at);

-- Create trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_notifications_updated_at_trigger
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();
