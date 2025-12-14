-- Migration: Create outliers table
-- Purpose: Store detected outlier videos for quick access and notification
-- Date: 2025-12-10

CREATE TABLE IF NOT EXISTS outliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Video & Channel identification
  video_id TEXT NOT NULL UNIQUE, -- YouTube video ID
  channel_id TEXT NOT NULL, -- YouTube channel ID
  channel_name TEXT NOT NULL,

  -- Video metadata
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- Duration in seconds

  -- Current metrics (updated on re-detection)
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments INTEGER DEFAULT 0,

  -- Outlier metrics
  multiplier DECIMAL(10, 2), -- Views / channel avg_views
  outlier_score INTEGER NOT NULL, -- 1-10 score
  velocity_score DECIMAL(10, 2), -- Views/hour acceleration
  engagement_ratio DECIMAL(10, 6), -- (likes + comments) / views

  -- Detection metadata
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When first flagged as outlier
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When metrics were last refreshed
  first_seen_views BIGINT, -- View count when first detected

  -- Status & tracking
  status TEXT DEFAULT 'active', -- active, dismissed, analyzed, archived
  is_new BOOLEAN DEFAULT true, -- False after user views it
  priority INTEGER DEFAULT 5, -- 1-10, user-assigned priority
  notes TEXT, -- User notes about this outlier

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_outliers_video_id ON outliers(video_id);
CREATE INDEX IF NOT EXISTS idx_outliers_channel_id ON outliers(channel_id);
CREATE INDEX IF NOT EXISTS idx_outliers_outlier_score ON outliers(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_velocity_score ON outliers(velocity_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_detected_at ON outliers(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_status ON outliers(status);
CREATE INDEX IF NOT EXISTS idx_outliers_is_new ON outliers(is_new);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_outliers_status_score ON outliers(status, outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_new_score ON outliers(is_new, outlier_score DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_outliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_outliers_timestamp
  BEFORE UPDATE ON outliers
  FOR EACH ROW
  EXECUTE FUNCTION update_outliers_updated_at();

-- Function to mark outlier as viewed (set is_new = false)
CREATE OR REPLACE FUNCTION mark_outlier_as_viewed(outlier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE outliers SET is_new = false WHERE id = outlier_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (Optional - uncomment if needed)
-- ALTER TABLE outliers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can read outliers" ON outliers FOR SELECT USING (true);
-- CREATE POLICY "Only authenticated users can modify" ON outliers FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE outliers IS 'Detected outlier videos that significantly outperform channel averages';
COMMENT ON COLUMN outliers.multiplier IS 'Video views divided by channel average views';
COMMENT ON COLUMN outliers.outlier_score IS '1-10 score indicating outlier strength';
COMMENT ON COLUMN outliers.velocity_score IS 'Views/hour acceleration rate';
COMMENT ON COLUMN outliers.is_new IS 'True until user views this outlier in the dashboard';
COMMENT ON COLUMN outliers.status IS 'active, dismissed, analyzed, or archived';
