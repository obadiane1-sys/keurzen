import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and anon key are required. ' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // URL detection is disabled on all platforms.
    // The /auth/callback screen manually calls verifyOtp() to exchange
    // the token_hash, which avoids the race condition where getSession()
    // returns null before the async exchange completes.
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-app-name': 'keurzen-mobile',
    },
  },
});

export default supabase;
