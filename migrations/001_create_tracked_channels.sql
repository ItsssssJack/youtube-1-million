-- Migration: Create tracked_channels table
-- Purpose: Store competitor channels that we're monitoring for outliers
-- Date: 2025-12-10

CREATE TABLE IF NOT EXISTS tracked_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Channel identification
  channel_id TEXT NOT NULL UNIQUE, -- YouTube channel ID (UC...)
  handle TEXT, -- Channel handle (@username)
  channel_name TEXT NOT NULL, -- Display name

  -- Channel metadata
  subscriber_count BIGINT DEFAULT 0,
  avg_views BIGINT DEFAULT 0, -- Average views per video
  total_videos INTEGER DEFAULT 0,

  -- Tracking metadata
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_frequency INTEGER DEFAULT 21600, -- Seconds between scrapes (default 6 hours)
  is_active BOOLEAN DEFAULT true, -- Enable/disable tracking
  scrape_priority INTEGER DEFAULT 5, -- 1-10, higher = scrape more frequently

  -- Channel categorization
  category TEXT DEFAULT 'ai_automation', -- ai_automation, productivity, tech_review, etc.
  tags TEXT[] DEFAULT '{}', -- Custom tags for filtering

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tracked_channels_channel_id ON tracked_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_handle ON tracked_channels(handle);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_is_active ON tracked_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_last_scraped ON tracked_channels(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_category ON tracked_channels(category);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tracked_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tracked_channels_timestamp
  BEFORE UPDATE ON tracked_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_channels_updated_at();

-- Row Level Security (Optional - uncomment if needed)
-- ALTER TABLE tracked_channels ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can read tracked channels" ON tracked_channels FOR SELECT USING (true);
-- CREATE POLICY "Only authenticated users can modify" ON tracked_channels FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE tracked_channels IS 'Stores competitor YouTube channels being monitored for outlier videos';
COMMENT ON COLUMN tracked_channels.scrape_frequency IS 'Seconds between scrapes (21600 = 6 hours)';
COMMENT ON COLUMN tracked_channels.scrape_priority IS '1-10 scale, higher priority channels scraped more frequently';
