import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from './env.js';

export function createUserClient(accessToken: string): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) throw new Error('SUPABASE_URL / ANON_KEY not configured');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export function createAdminClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured for admin client');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
