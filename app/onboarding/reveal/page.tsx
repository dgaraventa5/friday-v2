'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Quadrant = 'critical' | 'plan' | 'urgent' | 'backlog';

const QUADRANT_STYLES: Record<Quadrant, { bg: string; border: string; glow: string }> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    glow: '0 0 60px 40px rgba(239, 68, 68, 0.15)',
  },
  plan: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    glow: '0 0 60px 40px rgba(59, 130, 246, 0.15)',
  },
  urgent: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    glow: '0 0 60px 40px rgba(245, 158, 11, 0.15)',
  },
  backlog: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    glow: '0 0 60px 40px rgba(100, 116, 139, 0.15)',
  },
};

const QUADRANT_POSITIONS: Record<Quadrant, { row: number; col: number }> = {
  critical: { row: 1, col: 1 },
  plan: { row: 1, col: 2 },
  urgent: { row: 2, col: 1 },
  backlog: { row: 2, col: 2 },
};

function getQuadrant(importance: string, urgency: string): Quadrant {
  if (importance === 'important' && urgency === 'urgent') return 'critical';
  if (importance === 'important' && urgency === 'not-urgent') return 'plan';
  if (importance === 'not-important' && urgency === 'urgent') return 'urgent';
  return 'backlog';
}

export default function OnboardingRevealPage() {
  const { progress, isLoading, createTaskAndComplete } = useOnboarding();
  const router = useRouter();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const taskCreatedRef = useRef(false);

  const [showGrid, setShowGrid] = useState(false);
  const [dimOthers, setDimOthers] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [taskError, setTaskError] = useState(false);

  // Redirect if missing prerequisite data
  useEffect(() => {
    if (!isLoading && progress && (!progress.wizard_importance || !progress.wizard_urgency)) {
      router.push('/onboarding/classify');
    }
  }, [isLoading, progress, router]);

  // Create task on mount (only once)
  useEffect(() => {
    if (!isLoading && progress && progress.wizard_importance && progress.wizard_urgency && !taskCreatedRef.current) {
      taskCreatedRef.current = true;
      createTaskAndComplete().catch((err) => {
        console.error('Task creation failed:', err);
        setTaskError(true);
        taskCreatedRef.current = false; // Allow retry
        toast({
          title: 'something went wrong',
          description: "let's try again",
          variant: 'destructive',
        });
      });
    }
  }, [isLoading, progress, createTaskAndComplete, toast]);

  // Animation sequence (skip if prefers-reduced-motion)
  useEffect(() => {
    if (prefersReducedMotion || isLoading) {
      setShowGrid(true);
      setShowTask(true);
      setShowExplanation(true);
      setShowCta(true);
      return;
    }

    const timers = [
      setTimeout(() => setShowGrid(true), 200),
      setTimeout(() => setDimOthers(true), 500),
      setTimeout(() => setShowTask(true), 700),
      setTimeout(() => setShowGlow(true), 900),
      setTimeout(() => { setShowGlow(false); setDimOthers(false); }, 1500),
      setTimeout(() => setShowExplanation(true), 1700),
      setTimeout(() => setShowCta(true), 2000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion, isLoading]);

  const handleRetry = useCallback(async () => {
    setTaskError(false);
    try {
      await createTaskAndComplete();
    } catch {
      setTaskError(true);
      toast({
        title: 'something went wrong',
        description: "let's try again",
        variant: 'destructive',
      });
    }
  }, [createTaskAndComplete, toast]);

  if (isLoading) return null;
  if (!progress?.wizard_importance || !progress?.wizard_urgency) return null;

  const quadrant = getQuadrant(progress.wizard_importance, progress.wizard_urgency);
  const quadrantCopy = ONBOARDING_COPY.reveal.quadrants[quadrant];
  const quadrantStyle = QUADRANT_STYLES[quadrant];
  const allQuadrants: Quadrant[] = ['critical', 'plan', 'urgent', 'backlog'];

  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-yellow-500 transition-all duration-500 ease-out" style={{ width: '100%' }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 max-w-lg mx-auto w-full">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.reveal.headline}
        </motion.h1>

        {/* Matrix grid */}
        <motion.div
          className="mt-8 w-full grid grid-cols-2 grid-rows-2 gap-2 aspect-square max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: showGrid ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {allQuadrants.map((q) => {
            const pos = QUADRANT_POSITIONS[q];
            const style = QUADRANT_STYLES[q];
            const copy = ONBOARDING_COPY.reveal.quadrants[q];
            const isActive = q === quadrant;

            return (
              <motion.div
                key={q}
                className={`relative flex flex-col items-center justify-center rounded-lg border p-3 ${style.bg} ${style.border}`}
                style={{ gridRow: pos.row, gridColumn: pos.col }}
                animate={{
                  opacity: dimOthers && !isActive ? 0.4 : 1,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <span className="text-sm font-bold lowercase text-slate-700 dark:text-slate-300">
                  {copy.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 lowercase mt-0.5">
                  {copy.subtitle}
                </span>

                {/* Task card inside the active quadrant */}
                {isActive && showTask && (
                  <motion.div
                    layoutId="task-card"
                    className="absolute inset-2 flex flex-col items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 shadow-sm"
                    initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      boxShadow: showGlow ? quadrantStyle.glow : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      boxShadow: { duration: 0.6, ease: 'easeOut' },
                    }}
                  >
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 lowercase text-center truncate max-w-full px-1">
                      {progress.wizard_task_title}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Explanation */}
        <motion.div
          className="mt-6 text-center max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: showExplanation ? 1 : 0, y: showExplanation ? 0 : 10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-base font-medium text-slate-800 dark:text-slate-200 lowercase">
            {quadrantCopy.explanation}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 lowercase leading-relaxed">
            {quadrantCopy.detail}
          </p>
        </motion.div>

        {/* Error + retry */}
        {taskError && (
          <div className="mt-4 text-center">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">
              something went wrong creating your task
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              try again
            </Button>
          </div>
        )}

        {/* CTA */}
        <motion.div
          className="mt-auto pt-8 w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: showCta ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            {ONBOARDING_COPY.reveal.cta}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
