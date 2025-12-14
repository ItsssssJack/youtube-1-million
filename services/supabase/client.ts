import { createClient } from '@supabase/supabase-js';
import { Idea } from '../../types';
import config from '../../config';

// Create a dummy client if credentials are missing (prevents app crash)
const supabaseUrl = config.supabase.url || 'https://placeholder.supabase.co';
const supabaseKey = config.supabase.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return config.supabase.url && config.supabase.anonKey &&
         config.supabase.url !== 'https://placeholder.supabase.co';
};

export const checkSupabaseConnection = async () => {
  // First check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase.from('channel_stats').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

export const saveIdeaToSupabase = async (idea: Idea) => {
    try {
        // Store extra metadata in the notes field as JSON string since we can't change schema easily
        const metadata = {
            multiplier: idea.multiplier,
            views: idea.viewCount,
            avgViews: idea.avgViews,
            channel: idea.channelName
        };

        const { data, error } = await supabase
            .from('ideas')
            .insert([
                { 
                    title: idea.title,
                    status: idea.status,
                    priority: idea.priority,
                    source: idea.source,
                    score: idea.score,
                    thumbnail_url: idea.thumbnailUrl,
                    notes: JSON.stringify(metadata) // Storing rich data here
                }
            ])
            .select();

        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error('Error saving idea:', error);
        throw new Error(error.message || 'Could not save idea to database');
    }
};