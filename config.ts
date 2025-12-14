/**
 * Centralized Configuration
 *
 * All environment variables are loaded here and exported as typed constants.
 * This prevents hardcoded API keys and provides a single source of truth.
 */

interface AppConfig {
  youtube: {
    apiKey: string;
    defaultChannelHandle: string;
    quotaLimit: number;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  gemini: {
    apiKey: string;
  };
}

// Helper function to get env variable with fallback
const getEnv = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Centralized configuration object
export const config: AppConfig = {
  youtube: {
    apiKey: getEnv('VITE_YOUTUBE_API_KEY'),
    defaultChannelHandle: getEnv('VITE_DEFAULT_CHANNEL_HANDLE', ''),
    quotaLimit: parseInt(getEnv('VITE_YOUTUBE_QUOTA_LIMIT', '10000')),
  },
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  },
  gemini: {
    apiKey: getEnv('VITE_GEMINI_API_KEY'),
  },
};

// Validation: Check if required keys are present
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  if (!config.youtube.apiKey) missing.push('VITE_YOUTUBE_API_KEY');
  if (!config.supabase.url) missing.push('VITE_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  // Gemini is optional for now

  return {
    valid: missing.length === 0,
    missing,
  };
};

// Helper to get quota usage tracking key for localStorage
export const QUOTA_STORAGE_KEY = 'youtube_quota_usage';

export default config;
