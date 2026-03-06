# Friday Onboarding Experience — PRD

**Version:** 1.0  
**Date:** February 14, 2026  
**Author:** Dom Garaventa  
**Status:** Ready for Implementation  

---

## What This Document Is (And Isn't)

This PRD is designed to be handed directly to Claude Code as a complete implementation guide. It contains:
- Exact files to create, in order, with dependencies resolved
- Complete copy/messaging woven directly into the specs
- Explicit references to existing codebase patterns so integration is seamless
- A scoped v1 that ships a complete experience, with v1.1 and v1.2 clearly deferred

---

## The Problem (In One Sentence)

New users land on an empty dashboard with zero guidance, so they bounce before they ever experience Friday's core value: seeing their tasks intelligently prioritized.

## The Goal (In One Sentence)

Get a new user from sign-up to seeing their first task classified in the Eisenhower Matrix in under 90 seconds, with a moment of genuine delight.

## Success Metrics (Honest Ones)

We don't have baseline data yet. These are our targets for the first 30 days post-launch:

| Metric | Target | How We'll Measure |
|--------|--------|-------------------|
| Time to first task | < 90 seconds | Timestamp delta: `onboarding_progress.started_at` → first row in `tasks` table |
| Onboarding completion rate | > 60% | Users reaching `/dashboard` with ≥1 task ÷ users who saw `/onboarding/welcome` |
| D1 return rate | > 40% | Users who return within 24 hours of completing onboarding |
| Drop-off by step | Identify worst step | Funnel: welcome → task-input → classification → matrix-reveal → dashboard |

We'll set real baselines in 30 days and iterate from there.

---

## Scope: What Ships in v1

### In Scope
1. **Welcome screen** — branded, warm, one CTA ("let's go")
2. **Task input** — single screen: title + due date (inline, not a separate step)
3. **Classification** — single screen: two toggles (important? urgent?)
4. **Matrix reveal** — animated placement with quadrant explanation + celebration
5. **Redirect to dashboard** — with the task visible and correctly prioritized
6. **Database** — `onboarding_progress` table to track state and enable resume
7. **Route guards** — new users redirected to onboarding; completed users skip it

### Explicitly Deferred to v1.1
- Onboarding checklist (floating widget on dashboard)
- Personalization question ("what brings you to Friday?")
- "Skip onboarding" option (in v1, everyone goes through it — it's 90 seconds)

### Explicitly Deferred to v1.2
- Contextual prompts (Day 2 reminders intro, Day 3 calendar prompt, Day 7 review)
- Notification permission request
- Calendar connection prompt
- Pre-signup interactive matrix preview

### Why This Scope

The onboarding does ONE thing brilliantly: deliver the aha moment. A new user should understand the Eisenhower Matrix by experiencing it with their own real task — not by reading about it, watching a demo, or configuring settings. Everything else (checklist, personalization, contextual prompts) layers on top once this foundation is solid.

---

## The Flow (4 Screens)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Welcome    │────▶│   Task Input     │────▶│  Classification  │────▶│ Matrix Reveal│────▶ /dashboard
│              │     │  (title + date)  │     │  (important?     │     │ (celebration) │
│  "let's go"  │     │                  │     │   urgent?)       │     │              │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
     10 sec               30 sec                   20 sec                   15 sec
```

Total: ~75 seconds. One task created. One moment of delight. User understands the matrix.

---

## Screen-by-Screen Specification

### Screen 1: Welcome

**Route:** `/onboarding/welcome`  
**Purpose:** Set the tone. Make the user feel like they made a good choice.  
**Time budget:** 10 seconds

```
┌─────────────────────────────────────────────────┐
│                                                   │
│                    🟡 friday                       │
│                                                   │
│                                                   │
│        focus on what matters most.                │
│                                                   │
│     we'll help you sort through the noise        │
│     and zero in on your top priorities —         │
│     starting with the one thing on your          │
│     mind right now.                              │
│                                                   │
│                                                   │
│          ┌─────────────────────┐                  │
│          │     let's go →      │  (butter yellow) │
│          └─────────────────────┘                  │
│                                                   │
│              takes about 60 seconds               │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Implementation notes:**
- Full viewport height, centered content
- The 🟡 is a visual stand-in — use the existing Friday logo from the app
- All text is lowercase (Friday brand voice)
- "takes about 60 seconds" sets expectations and reduces abandonment
- No skip button in v1. The flow IS the product introduction.
- Button uses the existing `Button` component with `variant="default"` and Friday yellow styling
- Framer Motion: fade-in on mount (opacity 0→1, y: 10→0, duration 600ms, ease-out)

**Copy rationale:** "sort through the noise" speaks to the overwhelm problem. "the one thing on your mind right now" primes them for the next screen and reduces the pressure of "create a task" framing.

---

### Screen 2: Task Input

**Route:** `/onboarding/task`  
**Purpose:** Capture the user's first task — title and due date on ONE screen.  
**Time budget:** 30 seconds

```
┌─────────────────────────────────────────────────┐
│                                                   │
│     ← back                          step 1 of 3  │
│                                                   │
│                                                   │
│     what's the one thing you need                │
│     to get done?                                 │
│                                                   │
│     ┌───────────────────────────────────────┐    │
│     │  e.g., finish the quarterly report    │    │
│     └───────────────────────────────────────┘    │
│                                                   │
│                                                   │
│     when does it need to happen?                 │
│                                                   │
│     ┌─────────┐ ┌───────────┐ ┌───────────┐     │
│     │  today  │ │ tomorrow  │ │ this week │     │
│     └─────────┘ └───────────┘ └───────────┘     │
│     ┌──────────┐ ┌─────────────────────────┐     │
│     │ someday  │ │  📅 pick a date...     │     │
│     └──────────┘ └─────────────────────────┘     │
│                                                   │
│                                                   │
│          ┌─────────────────────┐                  │
│          │     continue →      │                  │
│          └─────────────────────┘                  │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Implementation notes:**
- Title input: auto-focused on mount. Standard text input matching existing `add-task-form.tsx` styling.
- Due date pills: horizontal wrap layout using existing button styles with `variant="outline"`. Selected state uses `variant="default"` with yellow.
- "pick a date" opens the existing date picker component if one exists, or a native `<input type="date">` as fallback.
- "someday" maps to `null` due date (no date set). This is important — don't force a date.
- Continue button disabled until title has ≥ 1 non-whitespace character. Due date selection is optional.
- "← back" returns to welcome screen.
- "step 1 of 3" uses muted text (text-slate-400).
- Keyboard: Enter key on title input moves focus to due date section. Enter with a selection proceeds.
- Framer Motion: slide-in from right (x: 30→0, opacity 0→1, duration 300ms).

**Why title + due date on one screen:** Title and due date are cognitively linked — when you think "finish the quarterly report," the deadline is already in your head. Two inputs on one screen is fine; the ADHD-friendly principle is "one decision per screen," and this is one decision: "what do you need to do?"

---

### Screen 3: Classification

**Route:** `/onboarding/classify`  
**Purpose:** Teach the Eisenhower Matrix through a real decision, not a lecture.  
**Time budget:** 20 seconds

```
┌─────────────────────────────────────────────────┐
│                                                   │
│     ← back                          step 2 of 3  │
│                                                   │
│                                                   │
│     let's prioritize it.                         │
│                                                   │
│     ┌───────────────────────────────────────┐    │
│     │  "finish the quarterly report"        │    │
│     │   📅 tomorrow                         │    │
│     └───────────────────────────────────────┘    │
│                                                   │
│                                                   │
│     is it important?                             │
│     tasks that directly impact your goals.       │
│                                                   │
│     ┌──────────────────┐ ┌──────────────────┐    │
│     │   ⭐ important   │ │  not important   │    │
│     └──────────────────┘ └──────────────────┘    │
│                                                   │
│                                                   │
│     is it urgent?                                │
│     tasks that can't wait — they need            │
│     attention now.                               │
│                                                   │
│     ┌──────────────────┐ ┌──────────────────┐    │
│     │   🔥 urgent      │ │   not urgent     │    │
│     └──────────────────┘ └──────────────────┘    │
│                                                   │
│                                                   │
│          ┌─────────────────────┐                  │
│          │   see where it lands →  │              │
│          └─────────────────────┘                  │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Implementation notes:**
- Task summary card at top: shows the title and due date they just entered. Light background (bg-slate-50 dark:bg-slate-800), rounded, with the Friday yellow left border.
- Important/Urgent toggles: side-by-side buttons, same pattern as due date pills. Only one can be selected per row.
- Both selections required before "see where it lands" button enables.
- Button copy "see where it lands" builds anticipation — this is the setup for the reveal moment.
- Framer Motion: same slide-in as Screen 2.

**Why both toggles on one screen:** Importance and urgency are the TWO axes of the Eisenhower Matrix. Presenting them together helps the user understand they're making a 2-dimensional classification, not two unrelated choices.

**Design detail:** When the user selects "important," subtly highlight the left half of a tiny 2×2 matrix icon in the corner. When they select "urgent," highlight the top half. This gives a micro-preview of the reveal. (Nice-to-have for v1, mandatory for v1.1.)

---

### Screen 4: Matrix Reveal

**Route:** `/onboarding/reveal`  
**Purpose:** The aha moment. Show where the task landed and WHY.  
**Time budget:** 15 seconds (but they can linger)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│                                                   │
│              nice — you've got this. ✨            │
│                                                   │
│     ┌─────────────────┬─────────────────┐        │
│     │                 │                 │        │
│     │    critical     │      plan       │        │
│     │    (do first)   │   (schedule)    │        │
│     │                 │                 │        │
│     │  ╔═════════╗    │                 │        │
│     │  ║ YOUR    ║    │                 │        │
│     │  ║ TASK    ║    │                 │        │
│     │  ╚═════════╝    │                 │        │
│     │                 │                 │        │
│     ├─────────────────┼─────────────────┤        │
│     │                 │                 │        │
│     │     urgent      │    backlog      │        │
│     │   (delegate)    │   (drop it?)    │        │
│     │                 │                 │        │
│     └─────────────────┴─────────────────┘        │
│                                                   │
│     Your task is urgent AND important —           │
│     that makes it critical. This means            │
│     it should be the first thing you              │
│     tackle today.                                 │
│                                                   │
│     friday will always surface your critical      │
│     tasks at the top so nothing slips.            │
│                                                   │
│          ┌─────────────────────┐                  │
│          │   go to my dashboard →  │              │
│          └─────────────────────┘                  │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Implementation notes:**
- The 2×2 matrix grid uses CSS Grid. Each quadrant is a colored card:
  - Critical: `bg-red-50 border-red-200` (dark: `bg-red-950 border-red-800`)
  - Plan: `bg-blue-50 border-blue-200` (dark: `bg-blue-950 border-blue-800`)
  - Urgent: `bg-amber-50 border-amber-200` (dark: `bg-amber-950 border-amber-800`)
  - Backlog: `bg-slate-50 border-slate-200` (dark: `bg-slate-800 border-slate-700`)
- The user's task appears in the correct quadrant with a subtle scale-up animation (scale 0.8→1, opacity 0→1, delay 400ms after page load).
- **Celebration — "glow + settle":** When the task card lands in its quadrant, a warm radial glow pulses outward from the card (using the quadrant's color at ~20% opacity, expanding from 0 to ~120px radius, 600ms ease-out). Simultaneously, the OTHER three quadrants dim to ~40% opacity. This creates a spotlight effect that's both celebratory and educational — it draws the eye exactly where it needs to go. After 1 second, the glow fades and the other quadrants return to full opacity as the explanation text appears below.
- Implementation: the glow is a CSS `box-shadow` animation on the task card (e.g., `box-shadow: 0 0 0 0px rgba(quadrantColor, 0.2)` → `box-shadow: 0 0 60px 40px rgba(quadrantColor, 0.15)`). The dimming is Framer Motion opacity transitions on the other three quadrant containers. Respect `prefers-reduced-motion` — if set, skip the glow and just show the task card appearing in the quadrant with a simple fade-in. No extra dependencies needed.
- Explanation text is dynamic based on quadrant placement. All four variants below:

**Quadrant-specific copy (all lowercase, warm tone):**

| Quadrant | Headline | Explanation |
|----------|----------|-------------|
| Critical (urgent + important) | "your task is urgent AND important — that makes it critical." | "this means it should be the first thing you tackle today. friday will always surface your critical tasks at the top so nothing slips." |
| Plan (important, not urgent) | "your task is important but not urgent — time to plan." | "schedule dedicated time for this one. these tasks drive long-term success but are easy to put off. friday will remind you before they become urgent." |
| Urgent (urgent, not important) | "your task is urgent but not that important — handle it quickly." | "knock this out fast or hand it off. don't let it eat into time for the things that really matter. friday keeps these separate so they don't hijack your day." |
| Backlog (neither) | "your task isn't urgent or important — it's in the backlog." | "this is a 'nice to have.' do it if you have the time, skip it if you don't. friday keeps these out of your way so you can focus on what counts." |

- "go to my dashboard" calls `createTaskAndComplete()` which inserts the task into the `tasks` table AND marks onboarding as `completed`, then navigates to `/dashboard`. The task does not exist in the `tasks` table until this button is clicked — prior steps only save wizard state to `onboarding_progress`.
- Framer Motion: see the **Celebration Animation: "Glow + Settle"** section below for the full timing sequence.

---

## Technical Implementation

### Prerequisite: Understand the Existing Codebase

Before writing any code, Claude Code MUST read these files to understand existing patterns:

```
READ FIRST (in this order):
1. app/dashboard/page.tsx              — understand the dashboard structure
2. components/dashboard/dashboard-client.tsx — understand client-side rendering
3. components/tasks/add-task-form.tsx   — understand task creation patterns
4. lib/types.ts                        — understand existing type definitions
5. lib/supabase/client.ts              — understand Supabase client usage
6. lib/supabase/middleware.ts           — understand route protection
7. app/auth/sign-up/page.tsx            — understand current auth flow
8. tailwind.config.ts                   — understand color/theme setup
```

### Step 1: Database Migration

Create the `onboarding_progress` table. This is the ONLY database change needed for v1.

```sql
-- Migration: add_onboarding_progress

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

**Schema design notes:** Wizard state is persisted in the database (not just React state) so users can refresh the page or switch devices without losing progress. The schema is intentionally lean — columns for checklist and contextual prompts will be added in v1.1 and v1.2 when those features ship.

### Step 2: Types

Add to `lib/types.ts`:

```typescript
// === Onboarding Types ===

export interface OnboardingProgress {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed' | 'skipped';
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

export type OnboardingStep = 'welcome' | 'task_input' | 'classify' | 'reveal' | 'done';
```

### Step 3: Onboarding Hook

Create `hooks/use-onboarding.ts`. This is the single source of truth for onboarding state.

**Important:** `advanceToStep` only updates the database. It does NOT navigate. Each page component is responsible for calling `router.push()` after awaiting `advanceToStep`. The one exception is `createTaskAndComplete()`, which handles task creation, marks onboarding complete, AND navigates to `/dashboard` — so the reveal page just calls it and is done.

```typescript
// hooks/use-onboarding.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { OnboardingProgress, OnboardingStep } from '@/lib/types';

export function useOnboarding() {
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load or create onboarding progress on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Try to load existing progress
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProgress(data);
      } else if (error?.code === 'PGRST116') {
        // No record exists — create one
        const { data: newProgress } = await supabase
          .from('onboarding_progress')
          .insert({ user_id: user.id })
          .select()
          .single();
        setProgress(newProgress);
      }
      
      setIsLoading(false);
    }
    init();
  }, [supabase]);

  // Navigate to the current step's route
  const navigateToCurrentStep = useCallback((step: OnboardingStep) => {
    const routes: Record<OnboardingStep, string> = {
      welcome: '/onboarding/welcome',
      task_input: '/onboarding/task',
      classify: '/onboarding/classify',
      reveal: '/onboarding/reveal',
      done: '/dashboard',
    };
    router.push(routes[step]);
  }, [router]);

  // Advance to next step and persist
  const advanceToStep = useCallback(async (
    nextStep: OnboardingStep,
    additionalData?: Partial<OnboardingProgress>
  ) => {
    if (!progress) return;

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
    if (!dueDate && progress.wizard_due_date_preset) {
      dueDate = calculateDueDate(progress.wizard_due_date_preset);
    }

    // Create the task using the same schema as add-task-form.tsx
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
    
    // Navigate to dashboard
    router.push('/dashboard');
  }, [progress, supabase, advanceToStep, router]);

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

**Design decisions:**
- Wizard state lives in the database, not React state — enables cross-device resume
- `createTaskAndComplete` handles both task creation AND onboarding completion atomically
- `navigateToCurrentStep` enables resume from any point
- `calculateDueDate` and `formatDate` are fully implemented helpers (no external dependencies)

### Step 4: Onboarding Layout

Create `app/onboarding/layout.tsx`:

```typescript
// app/onboarding/layout.tsx

// This layout wraps all /onboarding/* pages.
// It provides:
// 1. A clean full-viewport canvas (no nav, no sidebar)
// 2. Centered content with responsive padding
// 3. The Friday logo in the top-left corner

import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {children}
    </div>
  );
}
```

### Step 5: Page Components (Create in Order)

#### 5a. Welcome Page — `app/onboarding/welcome/page.tsx`

This page should:
- Call `useOnboarding()` and show a centered spinner or blank screen while `isLoading` is true
- Be full viewport, centered content
- Show the Friday logo (check existing components for the logo — likely in the nav or a shared component)
- Display the welcome copy exactly as specified in the screen spec above
- "let's go" button creates/updates onboarding progress to `task_input` step and navigates
- Use Framer Motion for a gentle fade-in
- All text lowercase per Friday brand

#### 5b. Task Input Page — `app/onboarding/task/page.tsx`

This page should:
- Call `useOnboarding()` and show a centered spinner while `isLoading` is true
- Pre-populate title and due date fields from `progress` if the user is resuming (e.g., they went back from classification)
- Show "← back" link and "step 1 of 3" indicator
- Auto-focus the title input on mount
- Display due date preset pills in a flex-wrap layout
- "pick a date" opens a date input (use existing date picker if available, otherwise native input)
- "someday" selection means no due date (wizard_due_date = null, wizard_due_date_preset = 'someday')
- "continue" button persists title + due date to `onboarding_progress` via `advanceToStep('classify', { wizard_task_title, wizard_due_date, wizard_due_date_preset })`, then navigates to `/onboarding/classify` via `router.push`
- Button disabled when title is empty or whitespace-only

#### 5c. Classification Page — `app/onboarding/classify/page.tsx`

This page should:
- Call `useOnboarding()` and show a centered spinner while `isLoading` is true
- If `progress.wizard_task_title` is null/empty, redirect to `/onboarding/task` (user arrived here without completing the previous step)
- Pre-populate importance/urgency selections from `progress` if the user is resuming
- Show "← back" link (navigates to `/onboarding/task` via `router.push`, does NOT update `current_step`) and "step 2 of 3" indicator
- Display a summary card showing the task title and due date from the database (read from `progress`)
- Two sets of toggle buttons: importance (important / not important) and urgency (urgent / not urgent)
- "see where it lands" button persists selections and navigates to reveal
- Button disabled until both importance and urgency are selected
- On clicking the button: persist both values via `advanceToStep('reveal', { wizard_importance, wizard_urgency })`, then navigate to `/onboarding/reveal` via `router.push`

#### 5d. Matrix Reveal Page — `app/onboarding/reveal/page.tsx`

This page should:
- Call `useOnboarding()` and show a centered spinner while `isLoading` is true
- If `progress.wizard_importance` or `progress.wizard_urgency` is null, redirect to `/onboarding/classify` (user arrived here without completing classification)
- No "← back" link and no step indicator — this is the celebration, not a form step
- Determine the quadrant from `progress.wizard_importance` and `progress.wizard_urgency`
- Render a 2×2 CSS Grid with the four quadrants, each with its name and subtitle
- Animate the user's task card into the correct quadrant (Framer Motion spring)
- Display the quadrant-specific explanation copy from the table above
- Fire the "glow + settle" celebration animation (CSS box-shadow + Framer Motion opacity, respect prefers-reduced-motion)
- "go to my dashboard" calls `createTaskAndComplete()` which inserts the task and marks onboarding done, then navigates to `/dashboard`

### Step 6: Route Protection

**Approach: Client-side redirect on dashboard, NOT server middleware.**

Do NOT add onboarding logic to `lib/supabase/middleware.ts`. Server middleware runs on every route and would require a database query per page load — that's a performance problem. Instead, add a lightweight client-side check in TWO places:

**6a. Dashboard redirect (the main guard):**

In `app/dashboard/page.tsx` (or `components/dashboard/dashboard-client.tsx` — whichever handles the initial client load), add a check near the top of the component:

```typescript
// On dashboard mount, check if user needs onboarding
const { progress, isLoading } = useOnboarding();

// While checking, show nothing (or a skeleton) — don't flash the empty dashboard
if (isLoading) return <OnboardingLoadingScreen />;

// If no onboarding record exists, check whether this is a NEW user or an EXISTING user.
// CRITICAL: Users who signed up BEFORE this feature shipped have no onboarding_progress
// record but should NOT be forced through onboarding. Check if they have any existing tasks.
if (!progress) {
  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  if (count === 0) {
    // New user, no tasks → send to onboarding
    router.push('/onboarding/welcome');
    return null;
  }
  // Existing user with tasks → skip onboarding, auto-create a 'completed' record so
  // this check never runs again
}

// If onboarding is in_progress, send them to their current step
if (progress?.status === 'in_progress') {
  navigateToCurrentStep(progress.current_step);
  return null;
}

// Otherwise (completed or skipped) → render dashboard normally
```

**6b. Onboarding exit guard:**

In `app/onboarding/layout.tsx`, add a check: if onboarding is already `completed`, redirect to `/dashboard`. This prevents completed users from manually navigating back to `/onboarding/*`.

**6c. Back navigation within the flow:**

The "← back" buttons on each screen should use simple `router.push()` calls to the previous route. There is NO middleware enforcing step order, so back navigation works naturally. The route guard only lives on the dashboard — it doesn't interfere with movement between onboarding screens.

This means a user *could* manually type `/onboarding/reveal` before completing classification. That's fine — the reveal page reads `progress.wizard_importance` and `progress.wizard_urgency` from the database, and if they're null, it should redirect back to `/onboarding/classify`. Each page should validate that its required data exists in `progress` and redirect backward if not.

**Page-level data validation (add to each page):**
- `/onboarding/welcome` — no prerequisites, always renders
- `/onboarding/task` — no prerequisites (user can arrive here fresh)
- `/onboarding/classify` — requires `wizard_task_title` to be non-null. If null, redirect to `/onboarding/task`
- `/onboarding/reveal` — requires `wizard_importance` and `wizard_urgency` to be non-null. If null, redirect to `/onboarding/classify`

### Step 7: Dashboard Integration

After onboarding completes, the user lands on `/dashboard`. Their task should be visible in the correct quadrant. No additional dashboard changes are needed for v1 — the existing task rendering should pick up the new task automatically.

**Verify:** After creating a task via the onboarding flow, load the dashboard and confirm the task appears in the correct position. If the dashboard has any "empty state" messaging, it should no longer show since there's now a task.

---

## File Inventory

```
NEW FILES (create in this order):
1.  lib/types.ts                          — ADD onboarding types (don't replace file)
2.  hooks/use-onboarding.ts               — onboarding state hook
3.  app/onboarding/layout.tsx             — clean full-screen layout (includes completed-user redirect)
4.  app/onboarding/welcome/page.tsx       — welcome screen
5.  app/onboarding/task/page.tsx          — task title + due date
6.  app/onboarding/classify/page.tsx      — importance + urgency toggles
7.  app/onboarding/reveal/page.tsx        — matrix reveal + glow celebration

MODIFIED FILES:
8.  components/dashboard/dashboard-client.tsx — ADD onboarding redirect check for new users
9.  app/auth/sign-up/page.tsx                — ADD redirect to /onboarding/welcome after signup

DATABASE:
10. Migration: add_onboarding_progress       — new table (SQL provided above)
```

---

## Design System Reference

All onboarding screens should use these tokens consistently:

| Token | Value | Usage |
|-------|-------|-------|
| Brand yellow | `#FDE047` / `yellow-300` | Primary buttons, selected states, accents |
| Background | `white` / `slate-950` (dark) | Page background |
| Headline text | `text-2xl md:text-3xl font-bold lowercase` | Screen headlines |
| Body text | `text-base text-slate-600 dark:text-slate-400` | Descriptions |
| Muted text | `text-sm text-slate-400 dark:text-slate-500` | Step indicators, hints |
| Content max-width | `max-w-md mx-auto` | Centers content on all screens |
| Vertical padding | `px-6 py-12 md:py-20` | Consistent spacing |
| Button (primary) | Existing `Button` with yellow bg | CTAs |
| Button (outline) | Existing `Button variant="outline"` | Date pills, toggles |
| Transition | `framer-motion` / 300ms ease-out | Page transitions |

---

## Celebration Animation: "Glow + Settle"

The reveal page celebration is handled entirely with CSS and Framer Motion — no extra components or dependencies needed.

**The sequence (all times relative to page mount):**

| Time | What happens |
|------|-------------|
| 0ms | Matrix grid fades in (opacity 0→1, 300ms) |
| 300ms | Three non-active quadrants dim (opacity 1→0.4, 400ms ease-out) |
| 400ms | Task card scales into the active quadrant (scale 0.8→1, opacity 0→1, spring physics) |
| 500ms | Radial glow pulses from task card (box-shadow expand, 600ms ease-out) |
| 1200ms | Glow fades, other quadrants return to full opacity (400ms ease-in) |
| 1400ms | Explanation text fades in below the matrix (opacity 0→1, y: 10→0, 400ms) |

**CSS for the glow (applied to the task card):**
```css
/* Quadrant-specific glow colors */
.glow-critical { box-shadow: 0 0 60px 40px rgba(239, 68, 68, 0.15); }   /* red-500 */
.glow-plan     { box-shadow: 0 0 60px 40px rgba(59, 130, 246, 0.15); }   /* blue-500 */
.glow-urgent   { box-shadow: 0 0 60px 40px rgba(245, 158, 11, 0.15); }   /* amber-500 */
.glow-backlog  { box-shadow: 0 0 60px 40px rgba(100, 116, 139, 0.15); }  /* slate-500 */
```

**Reduced motion:** If `prefers-reduced-motion` is set, skip all animations. Just render the matrix, the task in position, and the explanation — no glow, no dimming, no staggered reveals.

---

## Copy Reference (Complete)

Every piece of user-facing text in the onboarding, in one place:

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

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User refreshes mid-flow | `useOnboarding()` loads persisted state from database; page pre-populates fields from `progress` |
| User manually navigates to `/dashboard` before completing | Dashboard component checks onboarding status and redirects to current step |
| User manually types a later onboarding URL (e.g., `/onboarding/reveal`) | Each page validates its required data exists in `progress`; if not, redirects backward to the appropriate step |
| User clicks "← back" during the flow | Simple `router.push()` to previous route. No middleware interference — back navigation just works. |
| User signs up on phone, continues on laptop | Database-backed state syncs across devices |
| Network error creating the task | Show a toast error ("something went wrong — let's try again") with a retry button. Don't navigate away from the reveal page. |
| **Existing user (signed up before onboarding feature shipped)** | Dashboard checks for onboarding_progress record. If none exists, checks if user has any tasks. If tasks exist → auto-create a `completed` onboarding record and render dashboard normally. If no tasks → send to onboarding. |
| Title is just whitespace | Continue button stays disabled. No error message needed — the disabled state communicates. |
| User selects "someday" for due date | `wizard_due_date` is null. Task is created with no due date. The matrix classification still works because it's based on importance/urgency, not due date. |
| Dark mode | All color tokens use Tailwind dark: variants. Test both modes. |

---

## What Comes Next

### v1.1: Onboarding Checklist + Personalization
- Floating checklist widget on dashboard (4 items: create task ✓, add 2 more, complete one, connect calendar)
- Personalization question ("what brings you to Friday?") inserted between welcome and task input
- Personalization data stored in `onboarding_progress` (add `personalization_responses TEXT[]` column)

### v1.2: Contextual Prompts + Retention Hooks
- Day 2: Reminders introduction modal (triggered when user opens reminders OR on Day 2 login)
- Day 3: Calendar connection prompt (triggered when user opens calendar settings OR on Day 3 login)
- Day 7: Weekly review system task auto-created
- Notification permission request (after first task completion)
- Add `prompts_shown TEXT[]` and `checklist_items JSONB` columns to `onboarding_progress`

### v2.0: Intelligence Layer
- AI-suggested quadrant based on task title (use the existing prioritization algorithm as a starting point)
- Personalization-driven flow variants (different copy/examples based on user segment)
- A/B testing infrastructure for onboarding variants

---

**End of PRD**
