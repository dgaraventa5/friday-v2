'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';
import { Button } from '@/components/ui/button';

export default function OnboardingClassifyPage() {
  const { progress, isLoading, advanceToStep } = useOnboarding();
  const router = useRouter();

  const [importance, setImportance] = useState<'important' | 'not-important' | null>(null);
  const [urgency, setUrgency] = useState<'urgent' | 'not-urgent' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate from progress if resuming
  useEffect(() => {
    if (progress) {
      if (progress.wizard_importance) setImportance(progress.wizard_importance);
      if (progress.wizard_urgency) setUrgency(progress.wizard_urgency);
    }
  }, [progress]);

  // Redirect if missing prerequisite data
  useEffect(() => {
    if (!isLoading && progress && !progress.wizard_task_title) {
      router.push('/onboarding/task');
    }
  }, [isLoading, progress, router]);

  if (isLoading) return null;
  if (!progress?.wizard_task_title) return null;

  const bothSelected = importance !== null && urgency !== null;

  // Format due date for display
  const displayDate = (): string | null => {
    if (progress.wizard_due_date) {
      return new Date(progress.wizard_due_date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    if (progress.wizard_due_date_preset === 'someday') return 'someday';
    if (progress.wizard_due_date_preset) {
      return progress.wizard_due_date_preset === 'this_week'
        ? 'this week'
        : progress.wizard_due_date_preset;
    }
    return null;
  };

  const handleContinue = async () => {
    if (!bothSelected || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await advanceToStep('reveal', {
        wizard_importance: importance,
        wizard_urgency: urgency,
      });
      router.push('/onboarding/reveal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-yellow-500 transition-all duration-500 ease-out" style={{ width: '66%' }} />
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => router.push('/onboarding/task')}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {ONBOARDING_COPY.nav.back}
        </button>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {ONBOARDING_COPY.nav.stepIndicator(2, 3)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold lowercase text-slate-900 dark:text-slate-100">
          {ONBOARDING_COPY.classify.headline}
        </h1>

        {/* Task summary card */}
        <motion.div
          layoutId="task-card"
          className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-l-4 border-yellow-500"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <p className="font-medium text-slate-900 dark:text-slate-100 lowercase">
            &ldquo;{progress.wizard_task_title}&rdquo;
          </p>
          {displayDate() && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {displayDate()}
            </p>
          )}
        </motion.div>

        {/* Importance toggle */}
        <div className="mt-8">
          <h2 className="text-base font-medium lowercase text-slate-700 dark:text-slate-300">
            {ONBOARDING_COPY.classify.importanceLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {ONBOARDING_COPY.classify.importanceHint}
          </p>
          <div className="mt-3 flex gap-2">
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                variant={importance === 'important' ? 'default' : 'outline'}
                className="w-full lowercase"
                onClick={() => setImportance('important')}
              >
                {ONBOARDING_COPY.classify.importantOption}
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                variant={importance === 'not-important' ? 'default' : 'outline'}
                className="w-full lowercase"
                onClick={() => setImportance('not-important')}
              >
                {ONBOARDING_COPY.classify.notImportantOption}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Urgency toggle */}
        <div className="mt-8">
          <h2 className="text-base font-medium lowercase text-slate-700 dark:text-slate-300">
            {ONBOARDING_COPY.classify.urgencyLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {ONBOARDING_COPY.classify.urgencyHint}
          </p>
          <div className="mt-3 flex gap-2">
            <motion.div
              className="flex-1"
              whileTap={{ scale: 0.98 }}
              animate={urgency === 'urgent' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant={urgency === 'urgent' ? 'default' : 'outline'}
                className="w-full lowercase"
                onClick={() => setUrgency('urgent')}
              >
                {ONBOARDING_COPY.classify.urgentOption}
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                variant={urgency === 'not-urgent' ? 'default' : 'outline'}
                className="w-full lowercase"
                onClick={() => setUrgency('not-urgent')}
              >
                {ONBOARDING_COPY.classify.notUrgentOption}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Spacer + CTA */}
        <div className="mt-auto pt-8">
          <Button
            size="lg"
            className="w-full"
            disabled={!bothSelected || isSubmitting}
            onClick={handleContinue}
          >
            {ONBOARDING_COPY.classify.cta}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
