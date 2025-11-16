'use client';

import { createContext, useContext, useEffect, useId } from 'react';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CLIENT_SYMBOL = Symbol.for('__v0_supabase_client__');

declare global {
  // eslint-disable-next-line no-var
  var [SUPABASE_CLIENT_SYMBOL]: SupabaseClient | undefined;
}

const MODULE_LOAD_ID = Math.random().toString(36).substring(7);
// console.log('[v0] provider.tsx module loaded, ID:', MODULE_LOAD_ID);
// console.log('[v0] Module timestamp:', new Date().toISOString());

const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be created in the browser');
  }

  const sessionId = Math.random().toString(36).substring(7);
  
  // console.log('[v0] === getSupabaseBrowserClient called ===');
  // console.log('[v0] Session ID:', sessionId);
  // console.log('[v0] Timestamp:', new Date().toISOString());
  // console.log('[v0] Module Load ID:', MODULE_LOAD_ID);
  
  const existingClient = (globalThis as any)[SUPABASE_CLIENT_SYMBOL];
  // console.log('[v0] Existing client via Symbol:', !!existingClient);

  if (!existingClient) {
    // console.log('[v0] Creating NEW Supabase client with Symbol key');
    // console.log('[v0] Stack trace:');
    // console.trace('[v0] Client creation point');
    
    const newClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: `supabase.auth.token.${MODULE_LOAD_ID}`,
        },
      }
    );
    
    (globalThis as any)[SUPABASE_CLIENT_SYMBOL] = newClient;
    
    // console.log('[v0] Client created and stored with Symbol key');
    // console.log('[v0] Client instance ID:', newClient?.supabaseUrl);
    // console.log('[v0] Storage key:', `supabase.auth.token.${MODULE_LOAD_ID}`);
  } else {
    // console.log('[v0] Reusing EXISTING client from Symbol key');
  }
  
  // console.log('[v0] === End getSupabaseBrowserClient ===');

  return (globalThis as any)[SUPABASE_CLIENT_SYMBOL] as SupabaseClient;
};

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const providerId = useId();
  
  useEffect(() => {
    // console.log('[v0] SupabaseProvider MOUNTED, ID:', providerId);
    // console.log('[v0] Provider mount timestamp:', new Date().toISOString());
    
    return () => {
      // console.log('[v0] SupabaseProvider UNMOUNTED, ID:', providerId);
    };
  }, [providerId]);

  // console.log('[v0] SupabaseProvider RENDERING, ID:', providerId);
  const supabase = getSupabaseBrowserClient();

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  
  const callerId = useId();
  // console.log('[v0] useSupabase() called, caller ID:', callerId);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
