'use client';

import { createContext, useContext, useEffect, useId } from 'react';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const MODULE_LOAD_ID = Math.random().toString(36).substring(7);
console.log('[v0] provider.tsx module loaded, ID:', MODULE_LOAD_ID);
console.log('[v0] Module timestamp:', new Date().toISOString());

const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be created in the browser');
  }

  const sessionId = Math.random().toString(36).substring(7);
  
  console.log('[v0] === getSupabaseBrowserClient called ===');
  console.log('[v0] Session ID:', sessionId);
  console.log('[v0] Timestamp:', new Date().toISOString());
  console.log('[v0] Module Load ID:', MODULE_LOAD_ID);
  console.log('[v0] Window exists:', typeof window !== 'undefined');
  console.log('[v0] Current globalThis keys:', Object.keys(globalThis).filter(k => k.includes('supabase')));
  console.log('[v0] __supabaseClient exists:', !!(globalThis as any).__supabaseClient);

  // Store client on globalThis to survive HMR
  if (!(globalThis as any).__supabaseClient) {
    console.log('[v0] Creating NEW Supabase client');
    console.log('[v0] Stack trace:');
    console.trace('[v0] Client creation point');
    
    (globalThis as any).__supabaseClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('[v0] Client created and stored in globalThis');
    console.log('[v0] Client instance ID:', (globalThis as any).__supabaseClient?.supabaseUrl);
  } else {
    console.log('[v0] Reusing EXISTING client from globalThis');
  }
  
  console.log('[v0] === End getSupabaseBrowserClient ===');

  return (globalThis as any).__supabaseClient as SupabaseClient;
};

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const providerId = useId();
  
  useEffect(() => {
    console.log('[v0] SupabaseProvider MOUNTED, ID:', providerId);
    console.log('[v0] Provider mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('[v0] SupabaseProvider UNMOUNTED, ID:', providerId);
    };
  }, [providerId]);

  console.log('[v0] SupabaseProvider RENDERING, ID:', providerId);
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
  console.log('[v0] useSupabase() called, caller ID:', callerId);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
