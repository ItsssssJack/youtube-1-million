
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
  COMPETITORS = 'COMPETITORS',
  IDEAS = 'IDEAS',
  SPARRING = 'SPARRING',
  SETTINGS = 'SETTINGS',
}
