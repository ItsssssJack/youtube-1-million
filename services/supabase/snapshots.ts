/**
 * Supabase Service: Video Snapshots
 *
 * Operations for storing and retrieving historical video performance data
 */

import { supabase } from './client';
import { VideoSnapshot, VideoSnapshotInsert } from '../../types';

/**
 * Add a new video snapshot
 */
export const addSnapshot = async (snapshot: VideoSnapshotInsert): Promise<VideoSnapshot> => {
  const { data, error } = await supabase.from('video_snapshots').insert([snapshot]).select().single();

  if (error) {
    console.error('Error adding snapshot:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Add multiple snapshots in bulk
 */
export const addSnapshotsBulk = async (snapshots: VideoSnapshotInsert[]): Promise<VideoSnapshot[]> => {
  const { data, error } = await supabase.from('video_snapshots').insert(snapshots).select();

  if (error) {
    console.error('Error adding bulk snapshots:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get all snapshots for a video (ordered by time)
 */
export const getVideoSnapshots = async (videoId: string): Promise<VideoSnapshot[]> => {
  const { data, error } = await supabase
    .from('video_snapshots')
    .select('*')
    .eq('video_id', videoId)
    .order('snapshot_at', { ascending: false });

  if (error) {
    console.error('Error fetching video snapshots:', error);
    return [];
  }

  return data || [];
};

/**
 * Get latest snapshot for a video
 */
export const getLatestSnapshot = async (videoId: string): Promise<VideoSnapshot | null> => {
  const { data, error } = await supabase
    .from('video_snapshots')
    .select('*')
    .eq('video_id', videoId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching latest snapshot:', error);
    return null;
  }

  return data;
};

/**
 * Get snapshots for a channel
 */
export const getChannelSnapshots = async (
  channelId: string,
  limit?: number
): Promise<VideoSnapshot[]> => {
  let query = supabase
    .from('video_snapshots')
    .select('*')
    .eq('channel_id', channelId)
    .order('snapshot_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching channel snapshots:', error);
    return [];
  }

  return data || [];
};

/**
 * Get velocity trend for a video (compare last 2 snapshots)
 */
export const getVideoVelocity = async (videoId: string): Promise<number | null> => {
  const snapshots = await getVideoSnapshots(videoId);

  if (snapshots.length < 2) return null;

  const latest = snapshots[0];
  const previous = snapshots[1];

  const viewsDelta = latest.views - previous.views;
  const timeDelta = (new Date(latest.snapshot_at).getTime() - new Date(previous.snapshot_at).getTime()) / 1000; // seconds
  const hoursDelta = timeDelta / 3600;

  if (hoursDelta === 0) return null;

  return viewsDelta / hoursDelta; // Views per hour
};

/**
 * Calculate velocity for all snapshots of a video
 */
export const calculateVelocityHistory = async (
  videoId: string
): Promise<Array<{ timestamp: string; velocity: number }>> => {
  const snapshots = await getVideoSnapshots(videoId);

  if (snapshots.length < 2) return [];

  const velocities = [];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const current = snapshots[i];
    const previous = snapshots[i + 1];

    const viewsDelta = current.views - previous.views;
    const timeDelta =
      (new Date(current.snapshot_at).getTime() - new Date(previous.snapshot_at).getTime()) / 1000;
    const hoursDelta = timeDelta / 3600;

    if (hoursDelta > 0) {
      velocities.push({
        timestamp: current.snapshot_at,
        velocity: viewsDelta / hoursDelta,
      });
    }
  }

  return velocities;
};

/**
 * Get top velocity videos from recent snapshots
 */
export const getTopVelocityVideos = async (limit: number = 10): Promise<VideoSnapshot[]> => {
  const { data, error } = await supabase
    .from('video_snapshots')
    .select('*')
    .not('velocity_score', 'is', null)
    .order('velocity_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top velocity videos:', error);
    return [];
  }

  return data || [];
};

/**
 * Delete old snapshots (cleanup to save space)
 */
export const deleteOldSnapshots = async (daysToKeep: number = 90): Promise<number> => {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('video_snapshots')
    .delete()
    .lt('snapshot_at', cutoffDate)
    .select('id');

  if (error) {
    console.error('Error deleting old snapshots:', error);
    return 0;
  }

  return data?.length || 0;
};

/**
 * Get velocity metrics grouped by day for the last N days
 */
export const getVelocityTrendData = async (days: number = 7): Promise<Array<{ name: string; velocity: number }>> => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('video_snapshots')
    .select('velocity_score, snapshot_at')
    .gte('snapshot_at', cutoffDate)
    .not('velocity_score', 'is', null)
    .order('snapshot_at', { ascending: true });

  if (error) {
    console.error('Error fetching velocity trend data:', error);
    return [];
  }

  if (!data || data.length === 0) {
    // Return empty data for the last 7 days if no snapshots exist
    const emptyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      emptyData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        velocity: 0,
      });
    }
    return emptyData;
  }

  // Group by day and calculate average velocity per day
  const dayMap = new Map<string, { sum: number; count: number }>();

  data.forEach((snapshot) => {
    const date = new Date(snapshot.snapshot_at);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, { sum: 0, count: 0 });
    }

    const dayData = dayMap.get(dayKey)!;
    dayData.sum += snapshot.velocity_score || 0;
    dayData.count += 1;
  });

  // Convert to chart format
  const chartData = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayData = dayMap.get(dayKey);

    chartData.push({
      name: dayKey,
      velocity: dayData ? Math.round(dayData.sum / dayData.count) : 0,
    });
  }

  return chartData;
};
