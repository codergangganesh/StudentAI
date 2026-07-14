import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing! Database synchronization and Storage features will not function correctly until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Client-side Supabase Instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper for Guest session ID mapping
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';
export const MOCK_USER_PROFILE = {
  id: GUEST_USER_ID,
  display_name: 'Guest User',
  avatar_url: '',
};
