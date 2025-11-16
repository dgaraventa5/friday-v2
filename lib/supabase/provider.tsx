'use client';

import { createContext, useContext, useEffect, useId } from 'react';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

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
  console.log('[v0] Current window.__supabaseClient exists:', !!window.__supabaseClient);
  console.log('[v0] Window keys with supabase:', Object.keys(window).filter(k => k.includes('supabase')));

  if (!window.__supabaseClient) {
    console.log('[v0] Creating NEW Supabase client');
    console.log('[v0] Stack trace:');
    console.trace('[v0] Client creation point');
    
    window.__supabaseClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('[v0] Client created and stored in window');
    console.log('[v0] Client instance ID:', window.__supabaseClient?.supabaseUrl);
  } else {
    console.log('[v0] Reusing EXISTING client from window');
  }
  
  console.log('[v0] === End getSupabaseBrowserClient ===');

  return window.__supabaseClient;
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
