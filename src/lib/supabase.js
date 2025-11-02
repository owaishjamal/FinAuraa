/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment or config
const getSupabaseConfig = () => {
  // Try environment variables first (Vite uses import.meta.env)
  if (typeof window !== 'undefined') {
    let supabaseUrl = window.SUPABASE_URL || '';
    let supabaseAnonKey = window.SUPABASE_ANON_KEY || '';
    
    // Try Vite environment variables (import.meta.env is available in Vite)
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        supabaseUrl = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
        supabaseAnonKey = supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      }
    } catch (e) {
      // import.meta not available, skip
    }
    
    if (supabaseUrl && supabaseAnonKey) {
      return { url: supabaseUrl, key: supabaseAnonKey };
    }
  }
  
  // Fallback: try meta tag
  if (typeof document !== 'undefined') {
    const urlMeta = document.querySelector('meta[name="supabase-url"]');
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
    if (urlMeta && keyMeta) {
      return {
        url: urlMeta.getAttribute('content'),
        key: keyMeta.getAttribute('content')
      };
    }
  }
  
  // Return empty for local mode (will use local computation)
  return { url: '', key: '' };
};

const config = getSupabaseConfig();

// Create Supabase client (will work even with empty config for local mode)
let supabaseInstance = null;
try {
  if (config.url && config.key) {
    supabaseInstance = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
} catch (error) {
  console.error("Failed to create Supabase client:", error);
  supabaseInstance = null;
}

export const supabase = supabaseInstance; // null means we'll use local computation only

export const isSupabaseConfigured = () => supabase !== null;

