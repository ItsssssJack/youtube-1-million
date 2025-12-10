import { createClient } from '@supabase/supabase-js';
import { Idea } from '../types';

const supabaseUrl = 'https://gsgqulxxdxyhykyiyiap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZ3F1bHh4ZHh5aHlreWl5aWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjk0NTksImV4cCI6MjA4MDk0NTQ1OX0.Oy_24zGyVg449OBU8Dml9wAy7Vx-8qRW5feSPETysdw';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('channel_stats').select('count', { count: 'exact', head: true });
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