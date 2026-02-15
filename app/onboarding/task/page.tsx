'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DatePreset = 'today' | 'tomorrow' | 'this_week' | 'someday' | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: ONBOARDING_COPY.taskInput.datePresets.today },
  { key: 'tomorrow', label: ONBOARDING_COPY.taskInput.datePresets.tomorrow },
  { key: 'this_week', label: ONBOARDING_COPY.taskInput.datePresets.this_week },
  { key: 'someday', label: ONBOARDING_COPY.taskInput.datePresets.someday },
  { key: 'custom', label: ONBOARDING_COPY.taskInput.datePresets.custom },
];

export default function OnboardingTaskPage() {
  const { progress, isLoading, advanceToStep } = useOnboarding();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Local form state, pre-populated from progress if resuming
  const [title, setTitle] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate from progress on load
  useEffect(() => {
    if (progress) {
      if (progress.wizard_task_title) setTitle(progress.wizard_task_title);
      if (progress.wizard_due_date_preset) {
        setSelectedPreset(progress.wizard_due_date_preset as DatePreset);
      }
      if (progress.wizard_due_date && progress.wizard_due_date_preset === 'custom') {
        setCustomDate(progress.wizard_due_date);
      }
    }
  }, [progress]);

  // Auto-focus title input
  useEffect(() => {
    if (!isLoading) {
      titleRef.current?.focus();
    }
  }, [isLoading]);

  if (isLoading) return null;

  const titleValid = title.trim().length > 0;

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'custom') {
      setSelectedPreset('custom');
      // Trigger native date picker
      dateInputRef.current?.showPicker();
    } else {
      setSelectedPreset(preset);
      setCustomDate('');
    }
  };

  const handleContinue = async () => {
    if (!titleValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const wizardData: Record<string, unknown> = {
        wizard_task_title: title.trim(),
        wizard_due_date_preset: selectedPreset || null,
        wizard_due_date: selectedPreset === 'custom' && customDate ? customDate : null,
      };

      await advanceToStep('classify', wizardData);
      router.push('/onboarding/classify');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && titleValid) {
      handleContinue();
    }
  };

  // Format selected date for display in the task card preview
  const displayDate = (): string | null => {
    if (!selectedPreset) return null;
    if (selectedPreset === 'custom' && customDate) {
      return new Date(customDate + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    if (selectedPreset === 'someday') return 'someday';
    return selectedPreset === 'this_week' ? 'this week' : selectedPreset;
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
        <div className="h-full bg-yellow-500 transition-all duration-500 ease-out" style={{ width: '33%' }} />
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => router.push('/onboarding/welcome')}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {ONBOARDING_COPY.nav.back}
        </button>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {ONBOARDING_COPY.nav.stepIndicator(1, 3)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold lowercase text-slate-900 dark:text-slate-100">
          {ONBOARDING_COPY.taskInput.headline}
        </h1>

        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ONBOARDING_COPY.taskInput.placeholder}
          className="mt-6 text-base"
          autoComplete="off"
        />

        <h2 className="mt-8 text-base font-medium lowercase text-slate-700 dark:text-slate-300">
          {ONBOARDING_COPY.taskInput.dateLabel}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {DATE_PRESETS.map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedPreset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(key)}
              className="lowercase"
            >
              {label}
            </Button>
          ))}
          {/* Hidden native date input for "pick a date" */}
          <input
            ref={dateInputRef}
            type="date"
            className="sr-only"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setSelectedPreset('custom');
            }}
          />
        </div>

        {/* Task card preview */}
        <AnimatePresence>
          {titleValid && (
            <motion.div
              layoutId="task-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-l-4 border-yellow-500"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100 lowercase">
                &ldquo;{title.trim()}&rdquo;
              </p>
              {displayDate() && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {displayDate()}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer + CTA */}
        <div className="mt-auto pt-8">
          <Button
            size="lg"
            className="w-full"
            disabled={!titleValid || isSubmitting}
            onClick={handleContinue}
          >
            {ONBOARDING_COPY.taskInput.cta}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
