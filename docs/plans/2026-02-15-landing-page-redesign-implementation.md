# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Friday landing page ("The Exhale") — warm, human, editorially-crafted, 5 sections down from 7, with a looping hero animation.

**Architecture:** Full rewrite of landing page components. Delete 3 sections (ValueProps, EisenhowerMatrix, SocialProof), create 1 new (TrustSignal), rewrite 4 existing (Hero, Problem, HowItWorks, FinalCTA), update page shell (page.tsx header/footer/section order). All changes scoped to `components/landing/` and `app/page.tsx`. No backend, no database, no new dependencies.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Lucide icons, existing Shadcn UI components (Button, etc.)

**Design doc:** `docs/plans/2026-02-15-landing-page-redesign-design.md`

---

### Task 1: Scaffold new page structure and delete old sections

**Files:**
- Create: `components/landing/TrustSignalSection.tsx`
- Modify: `app/page.tsx`
- Delete: `components/landing/ValuePropsSection.tsx`
- Delete: `components/landing/EisenhowerMatrixSection.tsx`
- Delete: `components/landing/SocialProofSection.tsx`

**Step 1: Create TrustSignalSection.tsx**

```tsx
// components/landing/TrustSignalSection.tsx
export function TrustSignalSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-6 text-center">
        <p className="text-lg text-slate-400 mb-3">
          Built on a framework trusted by presidents, executives, and top
          performers for over 70 years.
        </p>
        <p className="text-sm text-slate-300">
          Free forever&nbsp;&middot;&nbsp;No credit card&nbsp;&middot;&nbsp;Set
          up in 60 seconds
        </p>
      </div>
    </section>
  );
}
```

**Step 2: Rewrite app/page.tsx**

Replace the entire file. Key changes: warm cream background, updated header/footer (no dark mode), new section order (Hero → Problem → HowItWorks → TrustSignal → FinalCTA), remove old imports.

```tsx
// app/page.tsx
import Link from "next/link";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSignalSection } from "@/components/landing/TrustSignalSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#FFFDF7]/90 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
            <span className="text-xl font-bold text-slate-800">friday</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-slate-600 hover:bg-amber-50"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <TrustSignalSection />
        <FinalCTASection />
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
                <span className="text-xl font-bold text-slate-800">friday</span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Focus on what matters most. Prioritize your daily tasks using
                proven productivity principles.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-700">
                Product
              </h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="hover:text-slate-800 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-700">
                Company
              </h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-amber-100 text-center">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Friday. Focus on what matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

**Step 3: Delete old section files**

```bash
rm components/landing/ValuePropsSection.tsx
rm components/landing/EisenhowerMatrixSection.tsx
rm components/landing/SocialProofSection.tsx
```

**Step 4: Verify the page loads**

Run: `npm run dev` and open `http://localhost:3000`
Expected: Page renders with the existing (not-yet-rewritten) Hero, Problem, HowItWorks, new TrustSignal, and existing FinalCTA sections. No import errors.

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: scaffold new landing page structure

Remove ValueProps, EisenhowerMatrix, and SocialProof sections.
Add TrustSignalSection. Update page.tsx with new section order,
warm cream background, and updated header/footer."
```

---

### Task 2: Rewrite HeroSection with looping animation

**Files:**
- Rewrite: `components/landing/HeroSection.tsx`

**Step 1: Rewrite HeroSection.tsx**

Replace the entire file. Key changes: looping 4-phase animation using CSS transitions on opacity/blur/transform, stacked with CSS grid, warm cream background, new headline and sub-headline copy, no dark mode.

```tsx
// components/landing/HeroSection.tsx
"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const allTasks = [
  "Respond to client emails",
  "Update project docs",
  "Schedule team meeting",
  "Review Q4 budget",
  "Fix production bug",
  "Call potential investor",
  "Prepare presentation",
  "Research competitors",
];

const focusedTasks = [
  "Fix production bug",
  "Call potential investor",
  "Respond to client emails",
  "Prepare presentation",
];

type Phase = "all" | "transitioning" | "focused" | "resetting";

const PHASE_DURATIONS: Record<Phase, number> = {
  all: 3000,
  transitioning: 2000,
  focused: 3000,
  resetting: 1200,
};

const NEXT_PHASE: Record<Phase, Phase> = {
  all: "transitioning",
  transitioning: "focused",
  focused: "resetting",
  resetting: "all",
};

export function HeroSection() {
  const [phase, setPhase] = useState<Phase>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(NEXT_PHASE[phase]);
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  const showAll = phase === "all" || phase === "resetting";
  const showFocused = phase === "transitioning" || phase === "focused";

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column — Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-slate-900">
              Every day, just{" "}
              <span className="text-yellow-600">4&nbsp;things</span> that
              matter.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-[540px]">
              Friday uses the Eisenhower Matrix to cut through your overwhelming
              to-do list and surface the tasks that actually move your life
              forward.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 h-12 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
                >
                  Start Focusing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 h-12 border-slate-200 text-slate-600 hover:bg-white"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </div>

            <p className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Free forever. No credit card required.
            </p>
          </div>

          {/* Right column — Looping animation */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/[0.04] p-6 md:p-8 relative z-10 overflow-hidden">
              {/* Both layers stacked in same grid cell */}
              <div className="grid [&>div]:col-start-1 [&>div]:row-start-1">
                {/* All Tasks layer */}
                <div
                  className="transition-all duration-[1200ms] ease-in-out"
                  style={{
                    opacity: showAll ? 1 : 0,
                    filter: showAll ? "blur(0px)" : "blur(6px)",
                  }}
                  aria-hidden={!showAll}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-400 text-sm tracking-wide">
                      Your Tasks
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-medium">
                      {allTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {allTasks.map((task) => (
                      <div
                        key={task}
                        className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl text-sm"
                      >
                        <div className="w-4 h-4 rounded border-2 border-slate-200 shrink-0" />
                        <span className="text-slate-500">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Focused Tasks layer */}
                <div
                  className="transition-all duration-[1200ms] ease-in-out"
                  style={{
                    opacity: showFocused ? 1 : 0,
                    transform: showFocused
                      ? "translateY(0)"
                      : "translateY(8px)",
                  }}
                  aria-hidden={!showFocused}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-amber-700 text-sm tracking-wide">
                      Today&apos;s Focus
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                      4 tasks
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {focusedTasks.map((task, i) => (
                      <div
                        key={task}
                        className="flex items-center gap-3 p-3.5 bg-amber-50/60 border-l-[3px] border-yellow-400 rounded-xl text-sm transition-all duration-700 ease-out"
                        style={{
                          transitionDelay: showFocused
                            ? `${i * 120}ms`
                            : "0ms",
                          opacity: showFocused ? 1 : 0,
                          transform: showFocused
                            ? "translateX(0)"
                            : "translateX(-12px)",
                        }}
                      >
                        <div className="w-4 h-4 rounded border-2 border-yellow-500 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-center text-xs text-slate-400 tracking-wide">
                    Prioritized automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Warm decorative glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-gradient-to-br from-yellow-100/50 to-amber-100/30 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

Run: `npm run dev` and open `http://localhost:3000`
Expected: Hero section shows warm cream background, new headline, and the animation loops smoothly through all 4 phases (~9s cycle). The "all tasks" list blurs/fades out while "Today's Focus" rises in, then crossfades back.

**Step 3: Commit**

```bash
git add components/landing/HeroSection.tsx && git commit -m "feat: redesign hero section with looping animation

New headline, warm palette, smooth 4-phase looping animation
using CSS transitions (blur/fade/translate). No dark mode."
```

---

### Task 3: Rewrite ProblemSection as editorial typography

**Files:**
- Rewrite: `components/landing/ProblemSection.tsx`

**Step 1: Rewrite ProblemSection.tsx**

Replace the entire file. Key changes: remove card grid and icons, pure editorial typography, new copy, transition line at bottom, no dark mode.

```tsx
// components/landing/ProblemSection.tsx
const painPoints = [
  "Your to-do list keeps growing, but nothing gets done.",
  "You spend more time organizing tasks than actually doing them.",
  "By 3pm, you\u2019re busy but can\u2019t name one important thing you finished.",
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-36">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-16 text-center">
            Sound familiar?
          </h2>

          <div className="space-y-8 md:space-y-10">
            {painPoints.map((point, i) => (
              <p
                key={i}
                className="text-xl md:text-2xl text-slate-600 leading-relaxed flex items-start gap-4"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full bg-yellow-400 mt-3 shrink-0"
                  aria-hidden="true"
                />
                {point}
              </p>
            ))}
          </div>

          <p className="mt-14 md:mt-16 text-center text-lg text-slate-400 italic">
            It&apos;s not a discipline problem. It&apos;s a prioritization
            problem.
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

Run: `npm run dev` — Problem section should show large, clean typographic statements with yellow dots, no cards, no icons.

**Step 3: Commit**

```bash
git add components/landing/ProblemSection.tsx && git commit -m "feat: redesign problem section as editorial typography

Replace card grid with clean typographic statements.
Add transition line bridging to solution section."
```

---

### Task 4: Rewrite HowItWorksSection as 3-act narrative

**Files:**
- Rewrite: `components/landing/HowItWorksSection.tsx`

This is the largest task — merges ValueProps, HowItWorks, and EisenhowerMatrix into one flowing narrative with 3 acts, each with a custom visual mockup.

**Step 1: Rewrite HowItWorksSection.tsx**

Replace the entire file:

```tsx
// components/landing/HowItWorksSection.tsx

/* ----- Act 1 Visual: Add Task Form ----- */
function AddTaskVisual() {
  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-amber-900/[0.04] p-6 border border-slate-100 max-w-sm mx-auto">
      <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
        New Task
      </div>
      <div className="space-y-3.5">
        <div className="h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
          <span className="text-sm text-slate-700">Prepare investor pitch</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">Work</span>
          </div>
          <div className="h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
            <span className="text-sm text-slate-500">Due tomorrow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-700 font-medium">Important</span>
          </div>
          <div className="flex-1 h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-amber-700 font-medium">Urgent</span>
          </div>
        </div>
        <div className="h-11 bg-yellow-400 rounded-xl flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-900">Add Task</span>
        </div>
      </div>
    </div>
  );
}

/* ----- Act 2 Visual: Eisenhower Matrix ----- */
function MatrixVisual() {
  return (
    <div className="max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 mb-1">CRITICAL</div>
          <div className="text-[11px] text-red-400 mb-3">
            Urgent + Important
          </div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Fix prod bug
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Client deadline
            </div>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-blue-600 mb-1">PLAN</div>
          <div className="text-[11px] text-blue-400 mb-3">
            Important, Not Urgent
          </div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Q2 strategy
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Learn new skill
            </div>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-amber-600 mb-1">DELEGATE</div>
          <div className="text-[11px] text-amber-400 mb-3">
            Urgent, Not Important
          </div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Meeting request
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Email replies
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 mb-1">ELIMINATE</div>
          <div className="text-[11px] text-slate-300 mb-3">Neither</div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-400">
              Busy work
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-400">
              Time wasters
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
          &rarr; Your top 4, surfaced automatically
        </span>
      </div>
    </div>
  );
}

/* ----- Act 3 Visual: Today's Focus ----- */
function TodaysFocusVisual() {
  const tasks = [
    {
      name: "Prepare investor pitch",
      category: "Work",
      categoryClasses: "bg-blue-50 text-blue-600",
    },
    {
      name: "Fix signup flow bug",
      category: "Work",
      categoryClasses: "bg-blue-50 text-blue-600",
    },
    {
      name: "Call Dr. Martinez",
      category: "Health",
      categoryClasses: "bg-rose-50 text-rose-600",
    },
    {
      name: "Review lease agreement",
      category: "Personal",
      categoryClasses: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-amber-900/[0.04] p-6 border border-slate-100 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-slate-800">
          Today&apos;s Focus
        </span>
        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
          <span className="text-sm leading-none">&#x1F525;</span>
          <span className="text-xs font-bold text-orange-600">7</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-amber-50/50 border-l-[3px] border-yellow-400 rounded-xl"
          >
            <div className="w-4 h-4 rounded border-2 border-yellow-500 shrink-0" />
            <span className="flex-1 text-sm font-medium text-slate-700 min-w-0 truncate">
              {task.name}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${task.categoryClasses}`}
            >
              {task.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----- Section ----- */

const acts = [
  {
    step: "01",
    title: "Dump everything in",
    description:
      "Add tasks with a name, category, and two simple toggles: important and urgent. No complex project management, no tags, no multi-step workflows. If it\u2019s on your mind, get it into Friday in seconds.",
    Visual: AddTaskVisual,
    reverse: false,
  },
  {
    step: "02",
    title: "Friday finds what matters",
    description:
      "Behind the scenes, Friday uses the Eisenhower Matrix \u2014 the same framework used by presidents and CEOs for decades \u2014 to score every task by importance, urgency, and deadline pressure. It automatically schedules your day so the right things get done first.",
    Visual: MatrixVisual,
    reverse: true,
  },
  {
    step: "03",
    title: "Focus on just 4 things today",
    description:
      "Every morning, Friday shows you exactly 4 tasks. Not 12. Not 30. Just the 4 that will make the biggest impact today. Complete them, and tomorrow\u2019s 4 are ready. With recurring tasks, streak tracking, and category balance built in.",
    Visual: TodaysFocusVisual,
    reverse: false,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-36 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-20 md:mb-28">
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-4">
            How Friday works
          </h2>
          <p className="text-lg text-slate-500">
            Three steps. No learning curve.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32 max-w-5xl mx-auto">
          {acts.map((act) => (
            <div
              key={act.step}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                act.reverse ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Text */}
              <div className={act.reverse ? "lg:col-start-2" : ""}>
                <div className="text-sm font-semibold text-yellow-600 mb-3 tracking-wide">
                  STEP {act.step}
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">
                  {act.title}
                </h3>
                <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                  {act.description}
                </p>
              </div>

              {/* Visual */}
              <div
                className={
                  act.reverse ? "lg:col-start-1 lg:row-start-1" : ""
                }
              >
                <act.Visual />
              </div>
            </div>
          ))}
        </div>

        {/* Eisenhower quote */}
        <blockquote className="max-w-xl mx-auto mt-24 md:mt-32 text-center">
          <p className="text-lg italic text-slate-400 leading-relaxed">
            &ldquo;What is important is seldom urgent, and what is urgent is
            seldom important.&rdquo;
          </p>
          <footer className="mt-3 text-sm text-slate-300">
            &mdash; Dwight D. Eisenhower
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

Run: `npm run dev` — How It Works section should show 3 alternating acts with unique visuals (form mockup, matrix grid, today's focus card), flowing narrative copy, and the Eisenhower quote at the bottom.

**Step 3: Commit**

```bash
git add components/landing/HowItWorksSection.tsx && git commit -m "feat: redesign how-it-works as 3-act narrative

Merge ValueProps, HowItWorks, and EisenhowerMatrix into one
flowing section with alternating layout and custom visuals."
```

---

### Task 5: Rewrite FinalCTASection

**Files:**
- Rewrite: `components/landing/FinalCTASection.tsx`

**Step 1: Rewrite FinalCTASection.tsx**

Replace the entire file. Key changes: remove email form, soften gradient, simplify to two buttons + trust line, no dark mode.

```tsx
// components/landing/FinalCTASection.tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCTASection() {
  return (
    <section className="py-24 md:py-36 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Ready to focus on what actually matters?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-10">
            Start with today&apos;s 4 most important tasks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="w-full sm:w-auto px-10 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-base"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 h-12 bg-white/80 border-slate-200 text-slate-700 hover:bg-white font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500">
            Free forever&nbsp;&middot;&nbsp;No credit
            card&nbsp;&middot;&nbsp;60 seconds to start
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

Run: `npm run dev` — Final CTA should show soft amber-to-peach gradient, dark primary button, Google secondary button, trust markers. No email form.

**Step 3: Commit**

```bash
git add components/landing/FinalCTASection.tsx && git commit -m "feat: redesign final CTA section

Remove email form, soften gradient, simplify to two buttons.
Conversational copy, warm palette, no dark mode."
```

---

### Task 6: Build verification and visual QA

**Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. No references to deleted files.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors. Fix any issues that arise.

**Step 3: Visual QA checklist**

Run `npm run dev` and verify on `http://localhost:3000`:

- [ ] Header: warm cream background, no visible border harshness, sticky works
- [ ] Hero: headline renders at large size, animation loops smoothly through 4 phases
- [ ] Hero: both CTAs work (sign-up link, smooth scroll to how-it-works)
- [ ] Problem: three statements with yellow dots, transition line below, no cards
- [ ] How It Works: 3 acts with alternating layout, each visual renders correctly
- [ ] How It Works: matrix grid shows 4 quadrants with correct colors
- [ ] Trust Signal: single centered line with trust markers
- [ ] Final CTA: soft gradient, two buttons, no email form
- [ ] Footer: warm colors, links work
- [ ] Mobile: check at 375px width — all sections stack properly, text readable
- [ ] No dark mode artifacts (no `dark:` classes anywhere in landing components)

**Step 4: Fix any issues found during QA**

Address anything that looks off.

**Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: visual polish from landing page QA"
```
