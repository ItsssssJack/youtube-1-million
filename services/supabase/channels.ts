/**
 * Supabase Service: Tracked Channels
 *
 * CRUD operations for competitor channels being monitored
 */

import { supabase } from './client';
import { TrackedChannel, TrackedChannelInsert } from '../../types';

/**
 * Fetch all tracked channels
 */
export const getTrackedChannels = async (activeOnly: boolean = true): Promise<TrackedChannel[]> => {
  let query = supabase.from('tracked_channels').select('*').order('scrape_priority', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tracked channels:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get a single tracked channel by ID or channel_id
 */
export const getTrackedChannel = async (identifier: string): Promise<TrackedChannel | null> => {
  // Try by UUID first, then by channel_id
  let { data, error } = await supabase.from('tracked_channels').select('*').eq('id', identifier).single();

  if (error && identifier.startsWith('UC')) {
    // Try by channel_id
    const result = await supabase.from('tracked_channels').select('*').eq('channel_id', identifier).single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error fetching tracked channel:', error);
    return null;
  }

  return data;
};

/**
 * Add a new tracked channel
 */
export const addTrackedChannel = async (channel: TrackedChannelInsert): Promise<TrackedChannel> => {
  const { data, error } = await supabase.from('tracked_channels').insert([channel]).select().single();

  if (error) {
    console.error('Error adding tracked channel:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update a tracked channel
 */
export const updateTrackedChannel = async (
  id: string,
  updates: Partial<TrackedChannelInsert>
): Promise<TrackedChannel> => {
  const { data, error } = await supabase.from('tracked_channels').update(updates).eq('id', id).select().single();

  if (error) {
    console.error('Error updating tracked channel:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update last_scraped_at timestamp for a channel
 */
export const markChannelScraped = async (channelId: string): Promise<void> => {
  const { error } = await supabase
    .from('tracked_channels')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('channel_id', channelId);

  if (error) {
    console.error('Error marking channel as scraped:', error);
  }
};

/**
 * Delete a tracked channel
 */
export const deleteTrackedChannel = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tracked_channels').delete().eq('id', id);

  if (error) {
    console.error('Error deleting tracked channel:', error);
    throw new Error(error.message);
  }
};

/**
 * Get channels that need scraping (based on last_scraped_at and scrape_frequency)
 */
export const getChannelsDueForScraping = async (limit: number = 25): Promise<TrackedChannel[]> => {
  const now = new Date();
  const channels = await getTrackedChannels(true);

  // Filter channels that are due for scraping
  const dueChannels = channels.filter(channel => {
    if (!channel.last_scraped_at) return true; // Never scraped

    const lastScraped = new Date(channel.last_scraped_at);
    const secondsSinceLastScrape = (now.getTime() - lastScraped.getTime()) / 1000;

    return secondsSinceLastScrape >= channel.scrape_frequency;
  });

  // Sort by priority (higher first), then by oldest last_scraped_at
  dueChannels.sort((a, b) => {
    if (a.scrape_priority !== b.scrape_priority) {
      return b.scrape_priority - a.scrape_priority;
    }

    if (!a.last_scraped_at) return -1;
    if (!b.last_scraped_at) return 1;

    return new Date(a.last_scraped_at).getTime() - new Date(b.last_scraped_at).getTime();
  });

  return dueChannels.slice(0, limit);
};

/**
 * Bulk update average views for channels (called after scraping)
 */
export const updateChannelStats = async (
  channelId: string,
  stats: { avg_views?: number; subscriber_count?: number; total_videos?: number }
): Promise<void> => {
  const { error } = await supabase.from('tracked_channels').update(stats).eq('channel_id', channelId);

  if (error) {
    console.error('Error updating channel stats:', error);
  }
};
