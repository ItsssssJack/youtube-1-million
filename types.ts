
export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  publishDate: string;
  outlierScore: number; // 1-10 scale
  multiplier?: number; // e.g. 2.4 (The explicit multiple vs average)
  channelName: string;
  category: string;
  engagementRatio: number;
  isOwnVideo?: boolean;
}

export interface Idea {
  id?: string; // Optional for new creations before DB insert
  title: string;
  status: 'Backlog' | 'Scripting' | 'Filming' | 'Editing' | 'Published';
  priority: 'High' | 'Medium' | 'Low';
  source: string;
  score: number;
  thumbnailUrl?: string; // New field for visual reference
  multiplier?: string; // e.g. "2.4x"
  viewCount?: number; // Snapshot of views when added
  avgViews?: number; // Snapshot of channel avg when added
  channelName?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  OUTLIERS = 'OUTLIERS',
  INSIGHTS = 'INSIGHTS',
  COMPETITORS = 'COMPETITORS',
  IDEAS = 'IDEAS',
  SPARRING = 'SPARRING',
  SETTINGS = 'SETTINGS',
}

// =============================================================================
// Database Types (matching Supabase schema)
// =============================================================================

export interface TrackedChannel {
  id: string;
  channel_id: string;
  handle?: string;
  channel_name: string;
  subscriber_count: number;
  avg_views: number;
  total_videos: number;
  last_scraped_at?: string;
  scrape_frequency: number;
  is_active: boolean;
  scrape_priority: number;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface VideoSnapshot {
  id: string;
  video_id: string;
  channel_id: string;
  views: number;
  likes: number;
  comments: number;
  title?: string;
  thumbnail_url?: string;
  published_at?: string;
  duration?: number;
  engagement_ratio?: number;
  velocity_score?: number;
  multiplier?: number;
  outlier_score?: number;
  snapshot_at: string;
  created_at: string;
}

export interface Outlier {
  id: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  thumbnail_url?: string;
  published_at?: string;
  duration?: number;
  views: number;
  likes: number;
  comments: number;
  multiplier?: number;
  outlier_score: number;
  velocity_score?: number;
  engagement_ratio?: number;
  detected_at: string;
  last_updated_at: string;
  first_seen_views?: number;
  status: 'active' | 'dismissed' | 'analyzed' | 'archived';
  is_new: boolean;
  priority: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Insert types (for creating new records, UUIDs and timestamps auto-generated)
export type TrackedChannelInsert = Omit<TrackedChannel, 'id' | 'created_at' | 'updated_at'>;
export type VideoSnapshotInsert = Omit<VideoSnapshot, 'id' | 'created_at'>;
export type OutlierInsert = Omit<Outlier, 'id' | 'created_at' | 'updated_at'>;
