# Onboarding Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-screen onboarding flow that gets new users from sign-up to their first Eisenhower Matrix classification in under 90 seconds.

**Architecture:** Client-side React pages under `/onboarding/*` with a shared `useOnboarding()` hook that persists wizard state to a new `onboarding_progress` Supabase table. Framer Motion provides page transitions and a shared `layoutId` task card element that travels between screens. A dashboard guard redirects new users into the flow.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion, Supabase (PostgreSQL + Auth), Tailwind CSS 4, existing Radix UI components.

**Design doc:** `docs/plans/2026-02-14-onboarding-design.md`
**PRD:** `docs/friday-onboarding-prd.md`

---

## Task 1: Install Framer Motion

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npm install framer-motion`

Expected: Package added to `dependencies` in `package.json`.

**Step 2: Verify installation**

Run: `npm ls framer-motion`

Expected: Shows `framer-motion@` with a version number, no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(onboarding): add framer-motion dependency"
```

---

## Task 2: Database Migration — `onboarding_progress` Table

**Files:**
- Database: Apply migration via Supabase MCP tool

**Step 1: Apply the migration**

Use the Supabase MCP `apply_migration` tool with project_id `fmqcycrvfeuhqrybhyvh` and this SQL:

```sql
-- Onboarding progress tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Flow state
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'skipped')),
  current_step TEXT NOT NULL DEFAULT 'welcome'
    CHECK (current_step IN ('welcome', 'task_input', 'classify', 'reveal', 'done')),

  -- Task wizard state (persisted for resume capability)
  wizard_task_title TEXT,
  wizard_due_date DATE,
  wizard_due_date_preset TEXT,
  wizard_importance TEXT CHECK (wizard_importance IN ('important', 'not-important')),
  wizard_urgency TEXT CHECK (wizard_urgency IN ('urgent', 'not-urgent')),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id
  ON public.onboarding_progress(user_id);
```

Migration name: `add_onboarding_progress`

**Step 2: Verify the table exists**

Use Supabase MCP `list_tables` for project `fmqcycrvfeuhqrybhyvh`, schemas `["public"]`.

Expected: `onboarding_progress` appears in the table list.

**Step 3: Verify RLS policies**

Use Supabase MCP `execute_sql`:

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'onboarding_progress';
```

Expected: Three policies listed (SELECT, INSERT, UPDATE).

---

## Task 3: Update Types in `lib/types.ts`

**Files:**
- Modify: `lib/types.ts:200-288` (the onboarding types section)

**Step 1: Replace the onboarding types section**

Replace the entire `// Onboarding Types` section (lines 200-288) with the simplified types that match the new database schema:

```typescript
// ============================================
// Onboarding Types
// ============================================

export type OnboardingStatus = 'in_progress' | 'completed' | 'skipped';

export type OnboardingStep = 'welcome' | 'task_input' | 'classify' | 'reveal' | 'done';

export interface OnboardingProgress {
  id: string;
  user_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  wizard_task_title: string | null;
  wizard_due_date: string | null;
  wizard_due_date_preset: string | null;
  wizard_importance: 'important' | 'not-important' | null;
  wizard_urgency: 'urgent' | 'not-urgent' | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

This removes: `OnboardingChecklistItem`, `PersonalizationOptionConfig`, `ContextualPromptConfig`, `QuadrantExplanation`, `TaskWizardState`, `ChecklistItemStatus`, `PersonalizationOption`, and the old `OnboardingStep`/`OnboardingProgress` types. These are all deferred to v1.1+.

**Step 2: Verify no broken imports**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: No errors referencing removed types. If any file imports removed types, fix those imports.

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(onboarding): simplify onboarding types to match v1 schema"
```

---

## Task 4: Create Onboarding Copy Constants

**Files:**
- Create: `lib/onboarding-copy.ts`

**Step 1: Create the copy file**

Create `lib/onboarding-copy.ts` with all user-facing onboarding text:

```typescript
export const ONBOARDING_COPY = {
  welcome: {
    headline: 'focus on what matters most.',
    body: "we'll help you sort through the noise and zero in on your top priorities — starting with the one thing on your mind right now.",
    cta: "let's go →",
    time_hint: 'takes about 60 seconds',
  },
  taskInput: {
    headline: "what's the one thing you need to get done?",
    placeholder: 'e.g., finish the quarterly report',
    dateLabel: 'when does it need to happen?',
    datePresets: {
      today: 'today',
      tomorrow: 'tomorrow',
      this_week: 'this week',
      someday: 'someday',
      custom: '📅 pick a date...',
    },
    cta: 'continue →',
  },
  classify: {
    headline: "let's prioritize it.",
    importanceLabel: 'is it important?',
    importanceHint: 'tasks that directly impact your goals.',
    importantOption: '⭐ important',
    notImportantOption: 'not important',
    urgencyLabel: 'is it urgent?',
    urgencyHint: "tasks that can't wait — they need attention now.",
    urgentOption: '🔥 urgent',
    notUrgentOption: 'not urgent',
    cta: 'see where it lands →',
  },
  reveal: {
    headline: "nice — you've got this. ✨",
    cta: 'go to my dashboard →',
    quadrants: {
      critical: {
        name: 'critical',
        subtitle: 'do first',
        explanation: 'your task is urgent AND important — that makes it critical.',
        detail: "this means it should be the first thing you tackle today. friday will always surface your critical tasks at the top so nothing slips.",
      },
      plan: {
        name: 'plan',
        subtitle: 'schedule it',
        explanation: "your task is important but not urgent — time to plan.",
        detail: "schedule dedicated time for this one. these tasks drive long-term success but are easy to put off. friday will remind you before they become urgent.",
      },
      urgent: {
        name: 'urgent',
        subtitle: 'delegate or batch',
        explanation: "your task is urgent but not that important — handle it quickly.",
        detail: "knock this out fast or hand it off. don't let it eat into time for the things that really matter. friday keeps these separate so they don't hijack your day.",
      },
      backlog: {
        name: 'backlog',
        subtitle: 'drop it?',
        explanation: "your task isn't urgent or important — it's in the backlog.",
        detail: "this is a 'nice to have.' do it if you have the time, skip it if you don't. friday keeps these out of your way so you can focus on what counts.",
      },
    },
  },
  nav: {
    back: '← back',
    stepIndicator: (current: number, total: number) => `step ${current} of ${total}`,
  },
} as const;
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep onboarding-copy`

Expected: No errors.

**Step 3: Commit**

```bash
git add lib/onboarding-copy.ts
git commit -m "feat(onboarding): add onboarding copy constants"
```

---

## Task 5: Create `useOnboarding` Hook

**Files:**
- Create: `hooks/use-onboarding.ts`

**Step 1: Create the hook**

Create `hooks/use-onboarding.ts`. This is the single source of truth for onboarding state.

```typescript
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
```

**Key design decisions:**
- `advanceToStep` only updates the database — does NOT navigate. Each page calls `router.push()` after awaiting it.
- `createTaskAndComplete` handles task creation + marking onboarding done. Does NOT navigate — caller handles that.
- The `useEffect` cleanup prevents state updates after unmount.
- `calculateDueDate` handles preset → actual date conversion.

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep use-onboarding`

Expected: No errors.

**Step 3: Commit**

```bash
git add hooks/use-onboarding.ts
git commit -m "feat(onboarding): add useOnboarding hook for state management"
```

---

## Task 6: Create Onboarding Layout

**Files:**
- Create: `app/onboarding/layout.tsx`

**Step 1: Create the layout**

Create `app/onboarding/layout.tsx`. This wraps all `/onboarding/*` pages with a clean full-viewport canvas and a guard that redirects completed users to the dashboard.

```typescript
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
```

**Step 2: Verify the layout renders**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds. `/onboarding/layout` is listed in the output.

**Step 3: Commit**

```bash
git add app/onboarding/layout.tsx
git commit -m "feat(onboarding): add onboarding layout with completion guard"
```

---

## Task 7: Create Welcome Page

**Files:**
- Create: `app/onboarding/welcome/page.tsx`

**Step 1: Create the welcome page**

Create `app/onboarding/welcome/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/hooks/use-onboarding';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';
import { SunLogo } from '@/components/auth/sun-logo';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function OnboardingWelcomePage() {
  const { progress, isLoading, advanceToStep } = useOnboarding();
  const router = useRouter();

  // If user is resuming and already past welcome, redirect to their current step
  useEffect(() => {
    if (!isLoading && progress && progress.current_step !== 'welcome') {
      const routes: Record<string, string> = {
        task_input: '/onboarding/task',
        classify: '/onboarding/classify',
        reveal: '/onboarding/reveal',
        done: '/dashboard',
      };
      router.push(routes[progress.current_step] || '/onboarding/welcome');
    }
  }, [isLoading, progress, router]);

  if (isLoading) return null;

  const handleStart = async () => {
    await advanceToStep('task_input');
    router.push('/onboarding/task');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
      <motion.div
        className="flex flex-col items-center text-center max-w-md"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <SunLogo size={48} />
        </motion.div>

        <motion.h1
          className="mt-8 text-2xl md:text-3xl font-bold lowercase text-slate-900 dark:text-slate-100"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.headline}
        </motion.h1>

        <motion.p
          className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.body}
        </motion.p>

        <motion.div
          className="mt-8"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Button size="lg" onClick={handleStart}>
            {ONBOARDING_COPY.welcome.cta}
          </Button>
        </motion.div>

        <motion.p
          className="mt-4 text-sm text-slate-400 dark:text-slate-500"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.time_hint}
        </motion.p>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify the page builds**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds. Route `/onboarding/welcome` listed.

**Step 3: Manual test**

Run dev server (`npm run dev`), navigate to `http://localhost:3000/onboarding/welcome` while logged in. Verify:
- Sun logo appears
- Text fades in with stagger
- "let's go" button is yellow
- Clicking navigates to `/onboarding/task`

**Step 4: Commit**

```bash
git add app/onboarding/welcome/page.tsx
git commit -m "feat(onboarding): add welcome screen with staggered fade-in"
```

---

## Task 8: Create Task Input Page

**Files:**
- Create: `app/onboarding/task/page.tsx`

**Step 1: Create the task input page**

Create `app/onboarding/task/page.tsx`:

```typescript
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
                  📅 {displayDate()}
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
```

**Step 2: Verify the page builds**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds.

**Step 3: Manual test**

Navigate to `/onboarding/task`. Verify:
- Title input is auto-focused
- Due date pills work (outline → yellow when selected)
- "pick a date" opens native date picker
- Task card preview appears when title is typed
- "continue" is disabled when title is empty
- Back button goes to welcome

**Step 4: Commit**

```bash
git add app/onboarding/task/page.tsx
git commit -m "feat(onboarding): add task input screen with date pills and card preview"
```

---

## Task 9: Create Classification Page

**Files:**
- Create: `app/onboarding/classify/page.tsx`

**Step 1: Create the classification page**

Create `app/onboarding/classify/page.tsx`:

```typescript
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
              📅 {displayDate()}
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
```

**Step 2: Verify the page builds**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds.

**Step 3: Manual test**

Navigate through `welcome → task → classify`. Verify:
- Task summary card shows at top with correct title and date
- Both toggle pairs work (outline → yellow)
- "see where it lands" disabled until both selected
- Urgency "urgent" button has a subtle pulse animation
- Back button goes to `/onboarding/task`

**Step 4: Commit**

```bash
git add app/onboarding/classify/page.tsx
git commit -m "feat(onboarding): add classification screen with importance/urgency toggles"
```

---

## Task 10: Create Matrix Reveal Page

**Files:**
- Create: `app/onboarding/reveal/page.tsx`

This is the most complex screen — the celebration moment. Build it carefully.

**Step 1: Create the reveal page**

Create `app/onboarding/reveal/page.tsx`:

```typescript
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

// Matrix layout: [top-left, top-right, bottom-left, bottom-right]
// = [critical, plan, urgent, backlog]
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
```

**Step 2: Verify the page builds**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds.

**Step 3: Manual test**

Navigate through the full flow: `welcome → task → classify → reveal`. Verify:
- Animation sequence plays: grid appears → non-active quadrants dim → task card appears in correct quadrant with glow → explanation fades in → CTA appears
- Task is created in the database (check Supabase dashboard)
- "go to my dashboard" navigates to `/dashboard`
- The created task appears on the dashboard

**Step 4: Commit**

```bash
git add app/onboarding/reveal/page.tsx
git commit -m "feat(onboarding): add matrix reveal screen with glow celebration"
```

---

## Task 11: Add Dashboard Onboarding Guard

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Add server-side onboarding check**

The dashboard page (`app/dashboard/page.tsx`) is a server component. Add an onboarding check after the auth check and before fetching tasks. This runs on the server, so no flash of dashboard content.

At line ~18 (after the profile fetch and before the services block), add:

```typescript
  // Check onboarding status — redirect new users to onboarding
  const { data: onboardingData } = await supabase
    .from('onboarding_progress')
    .select('status, current_step')
    .eq('user_id', data.user.id)
    .single();

  if (!onboardingData) {
    // No onboarding record — check if existing user or new user
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.user.id);

    if (count === 0) {
      // New user with no tasks → send to onboarding
      redirect('/onboarding/welcome');
    } else {
      // Existing user with tasks → auto-create completed record
      await supabase
        .from('onboarding_progress')
        .insert({
          user_id: data.user.id,
          status: 'completed',
          current_step: 'done',
          completed_at: new Date().toISOString(),
        });
    }
  } else if (onboardingData.status === 'in_progress') {
    // Resume onboarding at current step
    const stepRoutes: Record<string, string> = {
      welcome: '/onboarding/welcome',
      task_input: '/onboarding/task',
      classify: '/onboarding/classify',
      reveal: '/onboarding/reveal',
      done: '/dashboard',
    };
    const route = stepRoutes[onboardingData.current_step];
    if (route && route !== '/dashboard') {
      redirect(route);
    }
  }
  // If status === 'completed' or 'skipped', fall through to render dashboard
```

**Important:** This uses the server-side `supabase` client already available in the function. The `redirect()` function is already imported from `next/navigation`.

**Step 2: Verify the build**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds.

**Step 3: Test the guard**

- Log in as a user with existing tasks → should see dashboard normally
- Create a new test user → should redirect to `/onboarding/welcome`
- Start onboarding, close tab mid-flow, navigate to `/dashboard` → should redirect to current onboarding step

**Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(onboarding): add server-side onboarding guard to dashboard"
```

---

## Task 12: Update Middleware for Onboarding Routes

**Files:**
- Verify: `proxy.ts`, `lib/supabase/middleware.ts`

**Step 1: Verify no changes needed**

The current middleware in `lib/supabase/middleware.ts` (called from `proxy.ts`):
- Redirects unauthenticated users on non-`/auth` routes to `/auth/login` — this correctly protects `/onboarding/*` (requires auth)
- Redirects authenticated users on `/auth/*` or `/` to `/dashboard` — does NOT redirect from `/onboarding/*`

This means: authenticated users CAN access `/onboarding/*`, unauthenticated users CANNOT. This is exactly the behavior we want. **No middleware changes needed.**

**Step 2: Verify by testing**

- Visit `/onboarding/welcome` while logged out → should redirect to `/auth/login`
- Visit `/onboarding/welcome` while logged in → should render the welcome page

---

## Task 13: End-to-End Verification

**Step 1: Full flow test**

Run `npm run dev` and test the complete flow:

1. Sign up as a new user (or delete your `onboarding_progress` record + all tasks to simulate)
2. After auth callback → should redirect to `/dashboard` → dashboard guard redirects to `/onboarding/welcome`
3. Click "let's go" → navigates to `/onboarding/task`
4. Type a task title, select a due date → click "continue" → navigates to `/onboarding/classify`
5. Select importance and urgency → click "see where it lands" → navigates to `/onboarding/reveal`
6. Watch celebration animation. Verify task was created in Supabase.
7. Click "go to my dashboard" → navigates to `/dashboard`
8. Verify task appears in the correct quadrant on the dashboard
9. Refresh the dashboard → should stay on dashboard (not redirect back to onboarding)
10. Navigate to `/onboarding/welcome` → should redirect to `/dashboard` (completed guard)

**Step 2: Resume flow test**

1. Start onboarding, advance to classification page
2. Close the tab
3. Navigate to `/dashboard` → should redirect to `/onboarding/classify`
4. Verify task title and due date are pre-populated from the database

**Step 3: Existing user test**

1. As a user with existing tasks and no `onboarding_progress` record
2. Navigate to `/dashboard`
3. Should see dashboard normally (not redirected to onboarding)
4. Verify a `completed` record was auto-created in `onboarding_progress`

**Step 4: Dark mode test**

Toggle dark mode and verify all screens look correct with proper dark variants.

**Step 5: Mobile test**

Open Chrome DevTools → toggle device toolbar → test on iPhone 14 viewport:
- All content visible without horizontal scroll
- Touch targets ≥44px
- Due date pills wrap naturally
- Matrix grid fits the viewport

**Step 6: Reduced motion test**

In Chrome DevTools → Rendering → check "Emulate CSS media feature prefers-reduced-motion":
- Verify all pages render immediately without animation
- Verify reveal page shows task in position without glow or flying animation

**Step 7: Commit verification test**

Run: `npm run build`

Expected: Clean build with no errors or warnings related to onboarding.

---

## Summary of All Files

```
NEW FILES (6):
  lib/onboarding-copy.ts                   — all user-facing copy
  hooks/use-onboarding.ts                  — onboarding state hook
  app/onboarding/layout.tsx                — layout + completed guard
  app/onboarding/welcome/page.tsx          — welcome screen
  app/onboarding/task/page.tsx             — task input
  app/onboarding/classify/page.tsx         — classification
  app/onboarding/reveal/page.tsx           — matrix reveal

MODIFIED FILES (2):
  lib/types.ts                             — simplified onboarding types
  app/dashboard/page.tsx                   — server-side onboarding guard

NEW DEPENDENCY (1):
  framer-motion

DATABASE (1):
  Migration: add_onboarding_progress
```
