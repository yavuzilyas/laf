-- Event attendees table
-- Stores users who joined events
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event reference
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- User reference (nullable for non-registered users)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Anonymous attendee info (for non-registered users)
    name VARCHAR(100),
    email VARCHAR(255),
    
    -- When they joined
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: a user can only join an event once
    UNIQUE(event_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- Function to update attendee_count when someone joins
CREATE OR REPLACE FUNCTION update_attendee_count_on_join()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events 
    SET attendee_count = attendee_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attendee_count
DROP TRIGGER IF EXISTS update_attendee_count_on_join ON event_attendees;
CREATE TRIGGER update_attendee_count_on_join
    AFTER INSERT ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_attendee_count_on_join();

-- Function to update attendee_count when someone leaves
CREATE OR REPLACE FUNCTION update_attendee_count_on_leave()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events 
    SET attendee_count = GREATEST(attendee_count - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attendee_count on delete
DROP TRIGGER IF EXISTS update_attendee_count_on_leave ON event_attendees;
CREATE TRIGGER update_attendee_count_on_leave
    AFTER DELETE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_attendee_count_on_leave();
