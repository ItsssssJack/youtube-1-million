/**
 * Caching Layer
 *
 * Two-tier caching strategy:
 * 1. localStorage (fast, 6-hour TTL) - for immediate reads
 * 2. Supabase (persistent, unlimited) - for historical data and cross-session caching
 *
 * This keeps API usage low while maintaining fast UX.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const DEFAULT_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * LocalStorage Cache
 */
export class LocalCache {
  /**
   * Get item from localStorage cache
   */
  static get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('LocalCache get error:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Set item in localStorage cache
   */
  static set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('LocalCache set error (quota exceeded?):', error);
      // If localStorage is full, clear old entries
      this.clearExpired();
    }
  }

  /**
   * Remove item from localStorage cache
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all expired entries
   */
  static clearExpired(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const entry: CacheEntry<any> = JSON.parse(item);
        if (now - entry.timestamp > entry.ttl) {
          keysToRemove.push(key);
        }
      } catch {
        // Ignore parse errors
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Only clear cache entries, not user settings
      if (key.startsWith('cache_') || key.startsWith('channel_') || key.startsWith('video_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Generate cache keys
 */
export const CacheKeys = {
  channelVideos: (channelId: string) => `cache_channel_videos_${channelId}`,
  channelStats: (channelId: string) => `cache_channel_stats_${channelId}`,
  videoDetails: (videoId: string) => `cache_video_${videoId}`,
  outliers: () => `cache_outliers`,
  trackedChannels: () => `cache_tracked_channels`,
};

/**
 * Typed cache helpers
 */
export const ChannelCache = {
  getVideos: (channelId: string) => LocalCache.get<any[]>(CacheKeys.channelVideos(channelId)),
  setVideos: (channelId: string, videos: any[]) =>
    LocalCache.set(CacheKeys.channelVideos(channelId), videos),

  getStats: (channelId: string) => LocalCache.get<any>(CacheKeys.channelStats(channelId)),
  setStats: (channelId: string, stats: any) =>
    LocalCache.set(CacheKeys.channelStats(channelId), stats),
};

export const VideoCache = {
  get: (videoId: string) => LocalCache.get<any>(CacheKeys.videoDetails(videoId)),
  set: (videoId: string, video: any) => LocalCache.set(CacheKeys.videoDetails(videoId), video),
};

export const OutlierCache = {
  get: () => LocalCache.get<any[]>(CacheKeys.outliers()),
  set: (outliers: any[]) => LocalCache.set(CacheKeys.outliers(), outliers),
};
