'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { OnboardingProgress, OnboardingStep } from '@/lib/types';

const STEP_ROUTES: Record<OnboardingStep, string> = {
  welcome: '/onboarding/welcome',
  task_input: '/onboarding/task',
  classify: '/onboarding/classify',
  reveal: '/onboarding/reveal',
  done: '/dashboard',
};

export function useOnboarding() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load or create onboarding progress on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setIsLoading(false);
        return;
      }

      // Try to load existing progress
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cancelled) return;

      if (data) {
        setProgress(data);
      } else if (error?.code === 'PGRST116') {
        // No record exists — create one
        const { data: newProgress } = await supabase
          .from('onboarding_progress')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (!cancelled) setProgress(newProgress);
      }

      if (!cancelled) setIsLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [supabase]);

  // Navigate to the route for a given step
  const navigateToCurrentStep = useCallback((step: OnboardingStep) => {
    router.push(STEP_ROUTES[step]);
  }, [router]);

  // Advance to next step and persist to database
  const advanceToStep = useCallback(async (
    nextStep: OnboardingStep,
    additionalData?: Partial<OnboardingProgress>
  ) => {
    if (!progress) return null;

    const updates: Record<string, unknown> = {
      current_step: nextStep,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    if (nextStep === 'done') {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('onboarding_progress')
      .update(updates)
      .eq('id', progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }

    return data;
  }, [progress, supabase]);

  // Create the actual task from wizard state and complete onboarding
  const createTaskAndComplete = useCallback(async () => {
    if (!progress) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate due date from preset if no explicit date
    let dueDate = progress.wizard_due_date;
    if (!dueDate && progress.wizard_due_date_preset && progress.wizard_due_date_preset !== 'someday') {
      dueDate = calculateDueDate(progress.wizard_due_date_preset);
    }

    // Create the task matching the existing Task schema
    const { error: taskError } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: progress.wizard_task_title,
      due_date: dueDate,
      start_date: dueDate,
      importance: progress.wizard_importance || 'not-important',
      urgency: progress.wizard_urgency || 'not-urgent',
      category: 'Personal',
      estimated_hours: 1,
      completed: false,
      is_recurring: false,
    });

    if (taskError) {
      console.error('Failed to create task:', taskError);
      throw taskError;
    }

    // Mark onboarding as complete
    await advanceToStep('done');
  }, [progress, supabase, advanceToStep]);

  return {
    progress,
    isLoading,
    isComplete: progress?.status === 'completed',
    advanceToStep,
    createTaskAndComplete,
    navigateToCurrentStep,
  };
}

// Helper: calculate due date from a preset string
function calculateDueDate(preset: string): string {
  const today = new Date();

  switch (preset) {
    case 'today':
      return formatDate(today);
    case 'tomorrow': {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return formatDate(d);
    }
    case 'this_week': {
      const d = new Date(today);
      const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilFriday);
      return formatDate(d);
    }
    default:
      return formatDate(today);
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}
