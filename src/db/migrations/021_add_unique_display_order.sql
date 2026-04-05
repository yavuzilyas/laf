-- Migration to add unique constraint on display_order
-- This prevents duplicate order numbers which could cause rendering issues

-- First, we need to handle any existing duplicates
-- Find and update duplicate display_orders by assigning new unique values
DO $$
DECLARE
    duplicate_record RECORD;
    new_order INTEGER := 1000; -- Start from a high number to avoid conflicts
BEGIN
    -- For each group of duplicate display_orders, update all but the first one
    FOR duplicate_record IN
        SELECT id, display_order,
               ROW_NUMBER() OVER (PARTITION BY display_order ORDER BY created_at, id) as row_num
        FROM links
        WHERE display_order IN (
            SELECT display_order
            FROM links
            GROUP BY display_order
            HAVING COUNT(*) > 1
        )
    LOOP
        IF duplicate_record.row_num > 1 THEN
            UPDATE links 
            SET display_order = new_order
            WHERE id = duplicate_record.id;
            new_order := new_order + 1;
        END IF;
    END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE links ADD CONSTRAINT unique_display_order UNIQUE (display_order);
