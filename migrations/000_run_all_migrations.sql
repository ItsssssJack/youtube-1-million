-- =============================================================================
-- GROWTH INTELLIGENCE DASHBOARD - COMPLETE DATABASE SCHEMA
-- =============================================================================
-- Run this file in Supabase SQL Editor to create all tables at once
-- Date: 2025-12-10
-- =============================================================================

-- =============================================================================
-- TABLE 1: tracked_channels
-- Purpose: Store competitor channels that we're monitoring for outliers
-- =============================================================================

CREATE TABLE IF NOT EXISTS tracked_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Channel identification
  channel_id TEXT NOT NULL UNIQUE,
  handle TEXT,
  channel_name TEXT NOT NULL,

  -- Channel metadata
  subscriber_count BIGINT DEFAULT 0,
  avg_views BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,

  -- Tracking metadata
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_frequency INTEGER DEFAULT 21600,
  is_active BOOLEAN DEFAULT true,
  scrape_priority INTEGER DEFAULT 5,

  -- Channel categorization
  category TEXT DEFAULT 'ai_automation',
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_channels_channel_id ON tracked_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_handle ON tracked_channels(handle);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_is_active ON tracked_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_last_scraped ON tracked_channels(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_tracked_channels_category ON tracked_channels(category);

CREATE OR REPLACE FUNCTION update_tracked_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracked_channels_timestamp
  BEFORE UPDATE ON tracked_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_channels_updated_at();

-- =============================================================================
-- TABLE 2: video_snapshots
-- Purpose: Store historical snapshots of video performance for trend analysis
-- =============================================================================

CREATE TABLE IF NOT EXISTS video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Video identification
  video_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,

  -- Snapshot data
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments INTEGER DEFAULT 0,

  -- Video metadata
  title TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,

  -- Calculated metrics
  engagement_ratio DECIMAL(10, 6),
  velocity_score DECIMAL(10, 2),
  multiplier DECIMAL(10, 2),
  outlier_score INTEGER,

  -- Snapshot metadata
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_channel_id ON video_snapshots(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_snapshot_at ON video_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_outlier_score ON video_snapshots(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_velocity ON video_snapshots(velocity_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_time ON video_snapshots(video_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_channel_time ON video_snapshots(channel_id, snapshot_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_snapshots_unique ON video_snapshots(video_id, snapshot_at);

-- =============================================================================
-- TABLE 3: outliers
-- Purpose: Store detected outlier videos for quick access and notification
-- =============================================================================

CREATE TABLE IF NOT EXISTS outliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Video & Channel identification
  video_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,

  -- Video metadata
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,

  -- Current metrics
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments INTEGER DEFAULT 0,

  -- Outlier metrics
  multiplier DECIMAL(10, 2),
  outlier_score INTEGER NOT NULL,
  velocity_score DECIMAL(10, 2),
  engagement_ratio DECIMAL(10, 6),

  -- Detection metadata
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_seen_views BIGINT,

  -- Status & tracking
  status TEXT DEFAULT 'active',
  is_new BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outliers_video_id ON outliers(video_id);
CREATE INDEX IF NOT EXISTS idx_outliers_channel_id ON outliers(channel_id);
CREATE INDEX IF NOT EXISTS idx_outliers_outlier_score ON outliers(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_velocity_score ON outliers(velocity_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_detected_at ON outliers(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_status ON outliers(status);
CREATE INDEX IF NOT EXISTS idx_outliers_is_new ON outliers(is_new);
CREATE INDEX IF NOT EXISTS idx_outliers_status_score ON outliers(status, outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_outliers_new_score ON outliers(is_new, outlier_score DESC);

CREATE OR REPLACE FUNCTION update_outliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outliers_timestamp
  BEFORE UPDATE ON outliers
  FOR EACH ROW
  EXECUTE FUNCTION update_outliers_updated_at();

CREATE OR REPLACE FUNCTION mark_outlier_as_viewed(outlier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE outliers SET is_new = false WHERE id = outlier_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETE! All tables created successfully
-- =============================================================================
-- Next steps:
-- 1. Verify tables exist: Run "SELECT * FROM tracked_channels LIMIT 1;"
-- 2. Start adding competitor channels via the dashboard
-- 3. Enable Row Level Security if needed (see individual migration files)
-- =============================================================================
