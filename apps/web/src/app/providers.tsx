'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { setSupabaseClient, useMyHousehold } from '@keurzen/queries';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthInit } from '@/hooks/useAuthInit';
import { useAuthStore } from '@keurzen/stores';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase browser client and inject into shared queries
if (supabaseUrl && supabaseAnonKey) {
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  setSupabaseClient(supabase);
}

function AuthInit() {
  useAuthInit();
  return null;
}

function HouseholdInit() {
  const { user } = useAuthStore();
  useMyHousehold();
  if (!user) return null;
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit />
      <HouseholdInit />
      {children}
    </QueryClientProvider>
  );
}
