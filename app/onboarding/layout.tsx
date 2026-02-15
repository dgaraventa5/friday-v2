'use client';

import { ReactNode } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const { isComplete, isLoading } = useOnboarding();
  const router = useRouter();

  // Redirect completed users to dashboard
  useEffect(() => {
    if (!isLoading && isComplete) {
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

  if (isComplete) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950 flex flex-col">
      {children}
    </div>
  );
}
