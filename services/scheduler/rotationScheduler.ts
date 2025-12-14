/**
 * Rotation Scheduler
 *
 * Client-side scheduler that rotates through tracked channels in batches.
 * Designed to work within free tier quota constraints (10,000 units/day).
 *
 * Strategy:
 * - Divide channels into groups of 25
 * - Scrape 1 group every 6 hours (4 groups/day = 100 channels)
 * - Each channel costs ~100 quota units (2 API calls + 5 videos)
 * - 25 channels × 100 units = 2,500 units per session
 * - 4 sessions/day = 10,000 units (exactly at limit)
 */

import { getChannelsDueForScraping } from '../supabase/channels';
import { scrapeChannels, getScrapeResultsSummary, ScrapeOptions, ScrapeResult } from '../youtube/scraper';
import { getRemainingQuota, canScanChannels } from '../youtube/quota';
import { TrackedChannel } from '../../types';

export interface SchedulerState {
  isRunning: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  channelsScraped: number;
  outliersFound: number;
  quotaUsed: number;
  errors: string[];
}

export interface SchedulerConfig {
  batchSize: number; // Channels per batch (default: 25)
  intervalHours: number; // Hours between runs (default: 6)
  maxVideosPerChannel: number; // Videos to fetch per channel (default: 5)
  minOutlierScore: number; // Minimum score to flag (default: 6)
  autoStart: boolean; // Start automatically on init (default: false)
}

const DEFAULT_CONFIG: SchedulerConfig = {
  batchSize: 25,
  intervalHours: 6,
  maxVideosPerChannel: 5,
  minOutlierScore: 6,
  autoStart: false,
};

const SCHEDULER_STATE_KEY = 'scheduler_state';

/**
 * Get scheduler state from localStorage
 */
export const getSchedulerState = (): SchedulerState => {
  const stored = localStorage.getItem(SCHEDULER_STATE_KEY);
  if (!stored) {
    return {
      isRunning: false,
      lastRunAt: null,
      nextRunAt: null,
      channelsScraped: 0,
      outliersFound: 0,
      quotaUsed: 0,
      errors: [],
    };
  }
  return JSON.parse(stored);
};

/**
 * Save scheduler state to localStorage
 */
const saveSchedulerState = (state: SchedulerState): void => {
  localStorage.setItem(SCHEDULER_STATE_KEY, JSON.stringify(state));
};

/**
 * Calculate next run time based on interval
 */
const calculateNextRunTime = (intervalHours: number): string => {
  const next = new Date();
  next.setHours(next.getHours() + intervalHours);
  return next.toISOString();
};

/**
 * Check if it's time to run the scheduler
 */
export const shouldRunScheduler = (state: SchedulerState): boolean => {
  if (!state.nextRunAt) return true; // Never run before

  const now = new Date();
  const nextRun = new Date(state.nextRunAt);

  return now >= nextRun;
};

/**
 * Run a single scraping session
 */
export const runScrapingSession = async (
  config: Partial<SchedulerConfig> = {}
): Promise<ScrapeResult[]> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  console.log('🔄 Starting scraping session...');

  // Check quota
  const remainingQuota = getRemainingQuota();
  console.log(`📊 Remaining quota: ${remainingQuota} units`);

  if (!canScanChannels(cfg.batchSize)) {
    const error = `Insufficient quota. Need ${cfg.batchSize * 100} units, have ${remainingQuota}`;
    console.error(`❌ ${error}`);
    throw new Error(error);
  }

  // Get channels due for scraping
  console.log(`🔍 Finding channels due for scraping (batch size: ${cfg.batchSize})...`);
  const channels = await getChannelsDueForScraping(cfg.batchSize);

  if (channels.length === 0) {
    console.log('✓ No channels due for scraping');
    return [];
  }

  console.log(`📺 Found ${channels.length} channels to scrape`);

  // Scrape channels
  const scrapeOptions: ScrapeOptions = {
    maxVideosPerChannel: cfg.maxVideosPerChannel,
    minOutlierScore: cfg.minOutlierScore,
    storeAllSnapshots: false, // Only store outliers to save DB space
  };

  const results = await scrapeChannels(channels, scrapeOptions);

  // Summary
  const summary = getScrapeResultsSummary(results);
  console.log('✅ Scraping session complete:');
  console.log(`   - Channels: ${summary.totalChannels}`);
  console.log(`   - Videos: ${summary.totalVideos}`);
  console.log(`   - Outliers: ${summary.totalOutliers}`);
  console.log(`   - Quota used: ${summary.totalQuotaUsed} units`);
  console.log(`   - Errors: ${summary.totalErrors}`);

  return results;
};

/**
 * Start the rotation scheduler (call this on app init)
 */
export const startScheduler = async (config: Partial<SchedulerConfig> = {}): Promise<void> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const state = getSchedulerState();

  // Check if should run
  if (!shouldRunScheduler(state)) {
    const nextRun = new Date(state.nextRunAt!);
    const hoursUntil = (nextRun.getTime() - Date.now()) / (1000 * 60 * 60);
    console.log(`⏰ Next scrape in ${hoursUntil.toFixed(1)} hours`);
    return;
  }

  // Update state
  state.isRunning = true;
  saveSchedulerState(state);

  try {
    // Run scraping session
    const results = await runScrapingSession(cfg);
    const summary = getScrapeResultsSummary(results);

    // Update state with results
    state.isRunning = false;
    state.lastRunAt = new Date().toISOString();
    state.nextRunAt = calculateNextRunTime(cfg.intervalHours);
    state.channelsScraped = summary.totalChannels;
    state.outliersFound = summary.totalOutliers;
    state.quotaUsed = summary.totalQuotaUsed;
    state.errors = results
      .filter(r => r.errors.length > 0)
      .map(r => `${r.channelName}: ${r.errors.join(', ')}`);

    saveSchedulerState(state);

    console.log(`✓ Next scheduled run: ${new Date(state.nextRunAt).toLocaleString()}`);
  } catch (error: any) {
    console.error('❌ Scheduler error:', error);

    // Update state with error
    state.isRunning = false;
    state.errors = [error.message];
    state.nextRunAt = calculateNextRunTime(cfg.intervalHours);
    saveSchedulerState(state);
  }
};

/**
 * Force run scheduler now (ignore timing)
 */
export const forceRunScheduler = async (config: Partial<SchedulerConfig> = {}): Promise<ScrapeResult[]> => {
  console.log('🚀 Force running scheduler...');

  const state = getSchedulerState();
  state.isRunning = true;
  saveSchedulerState(state);

  try {
    const results = await runScrapingSession(config);
    const summary = getScrapeResultsSummary(results);

    state.isRunning = false;
    state.lastRunAt = new Date().toISOString();
    state.nextRunAt = calculateNextRunTime(config.intervalHours || DEFAULT_CONFIG.intervalHours);
    state.channelsScraped = summary.totalChannels;
    state.outliersFound = summary.totalOutliers;
    state.quotaUsed = summary.totalQuotaUsed;
    state.errors = results
      .filter(r => r.errors.length > 0)
      .map(r => `${r.channelName}: ${r.errors.join(', ')}`);

    saveSchedulerState(state);

    return results;
  } catch (error: any) {
    state.isRunning = false;
    state.errors = [error.message];
    saveSchedulerState(state);
    throw error;
  }
};

/**
 * Reset scheduler state (for testing)
 */
export const resetScheduler = (): void => {
  localStorage.removeItem(SCHEDULER_STATE_KEY);
  console.log('✓ Scheduler state reset');
};

/**
 * Get time until next scheduled run (in milliseconds)
 */
export const getTimeUntilNextRun = (): number => {
  const state = getSchedulerState();
  if (!state.nextRunAt) return 0;

  const nextRun = new Date(state.nextRunAt);
  const now = new Date();

  return Math.max(0, nextRun.getTime() - now.getTime());
};

/**
 * Format time until next run
 */
export const formatTimeUntilNextRun = (): string => {
  const ms = getTimeUntilNextRun();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0 && minutes === 0) return 'Ready to run';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};
