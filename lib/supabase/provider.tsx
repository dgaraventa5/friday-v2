'use client';

import { createContext, useContext } from 'react';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be created in the browser');
  }

  // Store client on globalThis to survive HMR
  if (!(globalThis as any).__supabaseClient) {
    (globalThis as any).__supabaseClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log('[v0] Supabase browser client created (globalThis singleton)');
  }

  return (globalThis as any).__supabaseClient as SupabaseClient;
};

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
