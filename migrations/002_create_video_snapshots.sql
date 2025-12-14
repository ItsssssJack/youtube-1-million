-- Migration: Create video_snapshots table
-- Purpose: Store historical snapshots of video performance for trend/velocity analysis
-- Date: 2025-12-10

CREATE TABLE IF NOT EXISTS video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Video identification
  video_id TEXT NOT NULL, -- YouTube video ID
  channel_id TEXT NOT NULL, -- YouTube channel ID

  -- Snapshot data (at time of capture)
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments INTEGER DEFAULT 0,

  -- Video metadata (mostly static but captured for reference)
  title TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- Duration in seconds

  -- Calculated metrics (at time of snapshot)
  engagement_ratio DECIMAL(10, 6), -- (likes + comments) / views
  velocity_score DECIMAL(10, 2), -- Views/hour since previous snapshot
  multiplier DECIMAL(10, 2), -- Views / channel avg_views
  outlier_score INTEGER, -- 1-10 score

  -- Snapshot metadata
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_channel_id ON video_snapshots(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_snapshot_at ON video_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_outlier_score ON video_snapshots(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_velocity ON video_snapshots(velocity_score DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_time ON video_snapshots(video_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_channel_time ON video_snapshots(channel_id, snapshot_at DESC);

-- Unique constraint to prevent duplicate snapshots at same time
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_snapshots_unique ON video_snapshots(video_id, snapshot_at);

COMMENT ON TABLE video_snapshots IS 'Historical performance snapshots of videos for trend and velocity analysis';
COMMENT ON COLUMN video_snapshots.velocity_score IS 'Calculated views/hour growth rate compared to previous snapshot';
COMMENT ON COLUMN video_snapshots.multiplier IS 'Video views divided by channel average views';
COMMENT ON COLUMN video_snapshots.outlier_score IS '1-10 score indicating how much video outperforms channel average';
