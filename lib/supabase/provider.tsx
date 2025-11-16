'use client';

import { createContext, useContext } from 'react';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// This ensures only ONE client is created regardless of Provider re-renders
let browserClient: SupabaseClient | null = null;

function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log('[v0] Supabase browser client created (singleton)');
  
  return browserClient;
}

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
