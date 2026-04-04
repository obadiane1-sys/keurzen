import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function setSupabaseClient(client: SupabaseClient): void {
  _client = client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    throw new Error(
      '@keurzen/queries: Supabase client not initialized. Call setSupabaseClient() first.'
    );
  }
  return _client;
}
