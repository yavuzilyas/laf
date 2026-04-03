-- Links table for social media and external links
-- Admin and moderators can manage these links
CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link details
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    
    -- Icon/image for the link
    icon_url TEXT,
    
    -- Link type/category (social, donation, external, etc.)
    type VARCHAR(50) DEFAULT 'social' CHECK (type IN ('social', 'donation', 'external', 'contact', 'other')),
    
    -- Platform identifier (twitter, youtube, instagram, etc.)
    platform VARCHAR(100),
    
    -- Display order for sorting
    display_order INTEGER DEFAULT 0,
    
    -- Visibility
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    click_count INTEGER DEFAULT 0,
    
    -- Who created/updated the link
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_type ON links(type);
CREATE INDEX IF NOT EXISTS idx_links_is_active ON links(is_active);
CREATE INDEX IF NOT EXISTS idx_links_display_order ON links(display_order);
CREATE INDEX IF NOT EXISTS idx_links_created_by ON links(created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_links_updated_at ON links;
CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION update_links_updated_at();
