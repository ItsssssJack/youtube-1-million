/**
 * YouTube API Quota Management
 *
 * Tracks YouTube Data API quota usage to stay within free tier limits (10,000 units/day).
 * Each API operation consumes different quota units.
 *
 * Common costs:
 * - search.list: 100 units
 * - videos.list: 1 unit
 * - channels.list: 1 unit
 * - playlistItems.list (channel videos): 1 unit
 */

import config, { QUOTA_STORAGE_KEY } from '../../config';

export interface QuotaUsage {
  date: string; // YYYY-MM-DD
  used: number;
  limit: number;
  operations: QuotaOperation[];
}

export interface QuotaOperation {
  timestamp: string;
  operation: string;
  cost: number;
}

// Quota costs for different operations
export const QUOTA_COSTS = {
  // Read operations
  'videos.list': 1,
  'channels.list': 1,
  'playlistItems.list': 1,
  'commentThreads.list': 1,

  // Search operations (expensive!)
  'search.list': 100,

  // Write operations (not used in read-only dashboard)
  'videos.update': 50,
  'playlists.insert': 50,
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Load quota usage from localStorage
 */
export const getQuotaUsage = (): QuotaUsage => {
  const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
  const today = getTodayString();

  if (!stored) {
    return {
      date: today,
      used: 0,
      limit: config.youtube.quotaLimit,
      operations: [],
    };
  }

  const data: QuotaUsage = JSON.parse(stored);

  // Reset if it's a new day
  if (data.date !== today) {
    return {
      date: today,
      used: 0,
      limit: config.youtube.quotaLimit,
      operations: [],
    };
  }

  return data;
};

/**
 * Save quota usage to localStorage
 */
const saveQuotaUsage = (usage: QuotaUsage): void => {
  localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(usage));
};

/**
 * Track an API operation and update quota usage
 */
export const trackQuotaUsage = (operation: keyof typeof QUOTA_COSTS): void => {
  const usage = getQuotaUsage();
  const cost = QUOTA_COSTS[operation] || 1;

  usage.used += cost;
  usage.operations.push({
    timestamp: new Date().toISOString(),
    operation,
    cost,
  });

  // Keep only last 100 operations to prevent localStorage bloat
  if (usage.operations.length > 100) {
    usage.operations = usage.operations.slice(-100);
  }

  saveQuotaUsage(usage);
};

/**
 * Check if quota is available for an operation
 */
export const canUseQuota = (operation: keyof typeof QUOTA_COSTS): boolean => {
  const usage = getQuotaUsage();
  const cost = QUOTA_COSTS[operation] || 1;
  return usage.used + cost <= usage.limit;
};

/**
 * Get remaining quota units
 */
export const getRemainingQuota = (): number => {
  const usage = getQuotaUsage();
  return Math.max(0, usage.limit - usage.used);
};

/**
 * Get quota usage percentage
 */
export const getQuotaPercentage = (): number => {
  const usage = getQuotaUsage();
  return (usage.used / usage.limit) * 100;
};

/**
 * Reset quota (for testing or manual override)
 */
export const resetQuota = (): void => {
  const today = getTodayString();
  const resetUsage: QuotaUsage = {
    date: today,
    used: 0,
    limit: config.youtube.quotaLimit,
    operations: [],
  };
  saveQuotaUsage(resetUsage);
};

/**
 * Estimate quota cost for fetching N channels
 */
export const estimateChannelScanCost = (numChannels: number): number => {
  // Per channel: 1 for channels.list + 1 for playlistItems.list (last 5 videos)
  return numChannels * 2;
};

/**
 * Check if we can scan N channels without exceeding quota
 */
export const canScanChannels = (numChannels: number): boolean => {
  const estimatedCost = estimateChannelScanCost(numChannels);
  const remaining = getRemainingQuota();
  return remaining >= estimatedCost;
};
