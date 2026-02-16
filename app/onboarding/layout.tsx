'use client';

import { ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingProvider, useOnboardingContext } from './onboarding-context';

function OnboardingLayoutInner({ children }: { children: ReactNode }) {
  const { isComplete, isLoading } = useOnboardingContext();
  const router = useRouter();
  const redirectingRef = useRef(false);

  // Redirect completed users to dashboard
  useEffect(() => {
    if (!isLoading && isComplete && !redirectingRef.current) {
      redirectingRef.current = true;
      router.push('/dashboard');
    }
  }, [isLoading, isComplete, router]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Keep rendering children even when isComplete — let the useEffect redirect
  // handle navigation. Returning null here unmounts children mid-navigation.
  return (
    <div className="h-dvh bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
      {children}
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
    </OnboardingProvider>
  );
}
