/**
 * Supabase Service: Outliers
 *
 * CRUD operations for detected outlier videos
 */

import { supabase } from './client';
import { Outlier, OutlierInsert } from '../../types';

/**
 * Fetch outliers with optional filtering
 */
export const getOutliers = async (options: {
  status?: 'active' | 'dismissed' | 'analyzed' | 'archived';
  onlyNew?: boolean;
  minScore?: number;
  limit?: number;
} = {}): Promise<Outlier[]> => {
  let query = supabase.from('outliers').select('*');

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.onlyNew) {
    query = query.eq('is_new', true);
  }

  if (options.minScore) {
    query = query.gte('outlier_score', options.minScore);
  }

  query = query.order('outlier_score', { ascending: false }).order('detected_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching outliers:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get a single outlier by video_id
 */
export const getOutlier = async (videoId: string): Promise<Outlier | null> => {
  const { data, error } = await supabase.from('outliers').select('*').eq('video_id', videoId).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching outlier:', error);
    return null;
  }

  return data;
};

/**
 * Add or update an outlier (upsert based on video_id)
 */
export const upsertOutlier = async (outlier: OutlierInsert): Promise<Outlier> => {
  // Check if exists
  const existing = await getOutlier(outlier.video_id);

  if (existing) {
    // Update existing outlier
    const { data, error } = await supabase
      .from('outliers')
      .update({
        ...outlier,
        last_updated_at: new Date().toISOString(),
      })
      .eq('video_id', outlier.video_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating outlier:', error);
      throw new Error(error.message);
    }

    return data;
  } else {
    // Insert new outlier
    const { data, error } = await supabase.from('outliers').insert([outlier]).select().single();

    if (error) {
      console.error('Error inserting outlier:', error);
      throw new Error(error.message);
    }

    return data;
  }
};

/**
 * Mark outlier as viewed (set is_new = false)
 */
export const markOutlierViewed = async (videoId: string): Promise<void> => {
  const { error } = await supabase.from('outliers').update({ is_new: false }).eq('video_id', videoId);

  if (error) {
    console.error('Error marking outlier as viewed:', error);
  }
};

/**
 * Update outlier status
 */
export const updateOutlierStatus = async (
  videoId: string,
  status: 'active' | 'dismissed' | 'analyzed' | 'archived'
): Promise<void> => {
  const { error } = await supabase.from('outliers').update({ status }).eq('video_id', videoId);

  if (error) {
    console.error('Error updating outlier status:', error);
    throw new Error(error.message);
  }
};

/**
 * Add notes to an outlier
 */
export const updateOutlierNotes = async (videoId: string, notes: string): Promise<void> => {
  const { error } = await supabase.from('outliers').update({ notes }).eq('video_id', videoId);

  if (error) {
    console.error('Error updating outlier notes:', error);
    throw new Error(error.message);
  }
};

/**
 * Delete an outlier
 */
export const deleteOutlier = async (videoId: string): Promise<void> => {
  const { error } = await supabase.from('outliers').delete().eq('video_id', videoId);

  if (error) {
    console.error('Error deleting outlier:', error);
    throw new Error(error.message);
  }
};

/**
 * Get count of new outliers
 */
export const getNewOutliersCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('outliers')
    .select('*', { count: 'exact', head: true })
    .eq('is_new', true)
    .eq('status', 'active');

  if (error) {
    console.error('Error getting new outliers count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get recent outliers (last 24 hours)
 */
export const getRecentOutliers = async (hours: number = 24): Promise<Outlier[]> => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('outliers')
    .select('*')
    .gte('detected_at', since)
    .order('outlier_score', { ascending: false });

  if (error) {
    console.error('Error fetching recent outliers:', error);
    return [];
  }

  return data || [];
};
