# Friday Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current generic-warm landing page with the approved cinematic "page-as-sunrise" direction, integrating CRO additions (product peek, anti-feature trust strip, mid-page CTA, FAQ) for both warm Twitter traffic and cold SEO traffic.

**Architecture:** Pure component-level refactor inside `components/landing/`. Three new section components are added; four existing ones are revised in place. The `app/page.tsx` shell only changes section order and imports. No new dependencies, no routing changes, no API or database work.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 (CSS-first config in `app/globals.css`), Lucide icons, existing custom `Button` component (`components/ui/button`).

**Source spec:** `docs/superpowers/specs/2026-04-25-landing-redesign-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Add a `.font-display` utility for the cinematic serif headlines. |
| `components/landing/hero-section.tsx` | Rewrite | Asymmetric split, sunrise gradient + sun glow, static product peek, dual CTA. Drop the current looping animation. |
| `components/landing/trust-strip-section.tsx` | **Create** | Anti-feature pills row + founder voice subline. |
| `components/landing/how-it-works-section.tsx` | Modify | Reframe as "Three Acts," horizontal-row layout, chapter numbers, tighter copy, warmer palette on visuals. Section ID: `#three-acts`. |
| `components/landing/mid-cta-section.tsx` | **Create** | Quiet single-row CTA between Three Acts and the Eisenhower quote. |
| `components/landing/trust-signal-section.tsx` | Modify | New eyebrow `— A NOTE FROM 1954 —`, drop oversized quote glyph, peach gradient background. |
| `components/landing/faq-section.tsx` | **Create** | Four Q&As covering competitor switch / >4 tasks / pricing / data. |
| `components/landing/final-cta-section.tsx` | Modify | Sunrise gradient + sun glow, new copy `It's Friday. Lighten the load.` |
| `app/page.tsx` | Modify | Add new imports, reorder sections, remove the gradient divider between Hero and Three Acts. |
| `components/landing/fade-in.tsx` | **Unchanged** | Existing animation utility, used as-is. |

---

## Verification Approach

This is UI work without an existing visual-test harness, so each task verifies via:

1. **Dev server visual check** — `npm run dev` (kept running across tasks) and a browser tab on `http://localhost:3000`. Each task names what to look for.
2. **Type / lint check** — `npm run lint` after changes.
3. **Build check** — `npm run build` once at the end of the plan.

The dev server should be started once at the beginning of Task 1 and left running. Hot reload picks up file changes automatically.

---

## Task 1: Add the `.font-display` utility

**Files:**
- Modify: `app/globals.css` (append to the existing utilities `@layer`, near line 640)

The hero, mid-CTA, Eisenhower quote, FAQ, and final CTA all use a cinematic display serif. Tailwind 4's default `font-serif` is fine but we want Iowan Old Style first when available (macOS / iOS users get the cinematic feel; everyone else falls back gracefully).

- [ ] **Step 1: Open `app/globals.css` and locate the existing `cta-hover` utility (around line 626).** Add the `.font-display` utility immediately after the closing brace of `.cta-hover:active` (around line 640).

```css
  /* Landing Page - Cinematic display serif (used for headlines) */
  .font-display {
    font-family: 'Iowan Old Style', 'Palatino', 'Palatino Linotype', Georgia, 'Times New Roman', serif;
  }
```

- [ ] **Step 2: Start the dev server.**

Run: `npm run dev`
Expected: Server starts on `http://localhost:3000`. Leave this terminal open for the rest of the plan.

- [ ] **Step 3: Open `http://localhost:3000` in a browser.** Page should render unchanged (we haven't touched components yet). Confirm no console errors.

- [ ] **Step 4: Type-check and lint.**

Run: `npm run lint`
Expected: Passes (no new lint errors from the CSS addition).

- [ ] **Step 5: Commit.**

```bash
git add app/globals.css
git commit -m "feat(landing): add .font-display utility for cinematic serif headlines"
```

---

## Task 2: Revise the Hero section

**Files:**
- Modify (full rewrite): `components/landing/hero-section.tsx`

Replaces the current looping all-tasks → focused-4 animation with a static asymmetric layout: cinematic text on the left, tilted "Today's Focus" product peek on the right. Sunrise gradient + sun glow flow across the hero.

- [ ] **Step 1: Replace the entire contents of `components/landing/hero-section.tsx` with this code.**

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const focusedTasks = [
  "Prepare investor pitch",
  "Fix signup flow bug",
  "Call Dr. Martinez",
  "Review lease agreement",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Sunrise gradient background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFDF7 0%, #fef3c7 38%, #fcd34d 75%, #fb923c 100%)",
        }}
        aria-hidden="true"
      />

      {/* Sun glow rising from bottom */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-64 w-[140%] aspect-square rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, #fffbeb 0%, #fef3c7 30%, #fcd34d 55%, #f59e0b 80%, transparent 95%)",
          boxShadow: "0 0 140px rgba(251, 191, 36, 0.55)",
        }}
        aria-hidden="true"
      />

      {/* Faint horizon line */}
      <div
        className="absolute left-0 right-0 bottom-[36%] h-px pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(120, 53, 15, 0.18) 30%, rgba(120, 53, 15, 0.18) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left column — text */}
          <div>
            <p className="animate-fade-up text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-900/70 mb-7">
              A Daily Focus App
            </p>
            <h1
              className="animate-fade-up font-display text-5xl md:text-7xl font-semibold leading-[0.95] tracking-tight text-slate-900"
              style={{ animationDelay: "100ms", letterSpacing: "-0.035em" }}
            >
              Less today.
            </h1>
            <h1
              className="animate-fade-up font-display text-5xl md:text-7xl font-normal italic leading-[0.95] tracking-tight text-amber-900 mt-1"
              style={{ animationDelay: "200ms", letterSpacing: "-0.035em" }}
            >
              More&nbsp;done.
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-base md:text-lg text-amber-950/90 leading-relaxed"
              style={{ animationDelay: "300ms" }}
            >
              The to-do list that picks your top four for you, every morning —
              using the same matrix Eisenhower built to run a continent.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ animationDelay: "400ms" }}
            >
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="cta-hover w-full sm:w-auto px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
                >
                  Begin Friday
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <a
                href="#three-acts"
                className="text-sm font-medium text-amber-900 underline underline-offset-4 decoration-amber-900/40 hover:decoration-amber-900 transition-colors"
              >
                See how it works ↓
              </a>
            </div>

            <p
              className="animate-fade-up mt-3 text-xs text-amber-950/75 font-medium"
              style={{ animationDelay: "500ms" }}
            >
              Free forever · No card · 60-second setup
            </p>
          </div>

          {/* Right column — product peek */}
          <div
            className="animate-fade-up relative"
            style={{ animationDelay: "350ms" }}
            aria-hidden="true"
          >
            <div
              className="bg-[#FFFDF7] border border-amber-700/25 rounded-2xl p-5 -rotate-2"
              style={{
                boxShadow:
                  "0 20px 60px rgba(120, 53, 15, 0.18), 0 4px 12px rgba(120, 53, 15, 0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">
                  Today&apos;s Focus
                </span>
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  🔥 7
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {focusedTasks.map((task) => (
                  <div
                    key={task}
                    className="bg-amber-100 border-l-[3px] border-yellow-500 px-3 py-2 rounded-md text-sm text-amber-950 font-medium"
                  >
                    {task}
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-slate-400 italic mt-3">
                Prioritized automatically · 4 of 27 tasks
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Reload `http://localhost:3000` and visually verify the new hero.**

Expected:
- Two-line headline `Less today.` + italic `More done.` in display serif (Iowan Old Style on macOS, Georgia fallback elsewhere).
- Eyebrow `A DAILY FOCUS APP` above the headline, letter-spaced.
- Subhead names Eisenhower.
- Slate-black `Begin Friday →` button with cream text.
- Underlined `See how it works ↓` text link beside it.
- Microcopy `Free forever · No card · 60-second setup`.
- A tilted "Today's Focus" card on the right with four real-feeling task names and a `🔥 7` streak badge.
- Whole section sits on a cream → amber → peach gradient with a glowing sun rising at the bottom.
- No console errors.

- [ ] **Step 3: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 4: Commit.**

```bash
git add components/landing/hero-section.tsx
git commit -m "feat(landing): rewrite hero with cinematic split + product peek"
```

---

## Task 3: Add the Trust Strip section

**Files:**
- Create: `components/landing/trust-strip-section.tsx`
- Modify: `app/page.tsx` (add import + section between Hero and the existing How-It-Works)

Anti-feature signaling: five short pills + a founder-voice subline. Pre-launch trust without fake metrics.

- [ ] **Step 1: Create `components/landing/trust-strip-section.tsx` with this code.**

```tsx
const pills = [
  "No AI gimmicks",
  "No bloat",
  "No upsells",
  "No tracking",
  "Just clarity",
];

export function TrustStripSection() {
  return (
    <section
      className="bg-amber-50 border-y"
      style={{ borderColor: "rgba(180, 83, 9, 0.1)" }}
    >
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {pills.map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-amber-900"
            >
              <span className="text-yellow-600" aria-hidden="true">
                ✦
              </span>
              <span>{pill}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] md:text-xs italic text-amber-800/85 mt-4">
          Hand-built solo — because every other to-do list got it wrong.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Open `app/page.tsx`. Add the import.**

Find this line (around line 5):
```tsx
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
```

Add immediately above it:
```tsx
import { TrustStripSection } from "@/components/landing/trust-strip-section";
```

- [ ] **Step 3: Insert the section in the page body.**

Find this block (around line 42-50 in `app/page.tsx`):
```tsx
        <HeroSection />

        {/* Gradient divider: Hero → HowItWorks */}
        <div
          className="h-px mx-auto max-w-3xl bg-gradient-to-r from-transparent via-amber-200/60 to-transparent"
          aria-hidden="true"
        />

        <HowItWorksSection />
```

Replace with:
```tsx
        <HeroSection />
        <TrustStripSection />
        <HowItWorksSection />
```

(The gradient divider is removed — the trust strip's own borders handle the transition.)

- [ ] **Step 4: Reload `http://localhost:3000` and visually verify.**

Expected:
- Below the hero, a thin horizontal band on a warm cream background.
- Five pills with yellow `✦` glyphs: `No AI gimmicks · No bloat · No upsells · No tracking · Just clarity`.
- Subline below the pills: italic `Hand-built solo — because every other to-do list got it wrong.`
- Hairline borders top and bottom of the band.
- The previous yellow gradient divider under the hero is gone.

- [ ] **Step 5: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 6: Commit.**

```bash
git add components/landing/trust-strip-section.tsx app/page.tsx
git commit -m "feat(landing): add anti-feature trust strip below hero"
```

---

## Task 4: Revise Three Acts (was How It Works)

**Files:**
- Modify: `components/landing/how-it-works-section.tsx`

Reframe the three-step explainer as "Three Acts." New section ID, new section header, new act headlines, horizontal-row layout with chapter numbers, warmer palette on the existing inline visuals.

- [ ] **Step 1: Replace the entire contents of `components/landing/how-it-works-section.tsx` with this code.**

```tsx
import { FadeIn } from "./fade-in";

/* ----- Act 1 Visual: Add Task Form ----- */
function AddTaskVisual() {
  return (
    <div
      className="hover-tilt bg-[#FFFDF7] rounded-2xl p-6 max-w-sm"
      style={{
        border: "1px solid rgba(180, 83, 9, 0.2)",
        boxShadow: "0 8px 30px rgba(120, 53, 15, 0.08)",
      }}
    >
      <div className="text-xs font-semibold text-amber-700 mb-4 uppercase tracking-wider">
        New Task
      </div>
      <div className="space-y-3.5">
        <div className="h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center px-4">
          <span className="text-sm text-slate-700">Prepare investor pitch</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">Work</span>
          </div>
          <div className="h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center justify-center">
            <span className="text-sm text-amber-800">Due tomorrow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-700 font-medium">Important</span>
          </div>
          <div className="flex-1 h-11 bg-amber-100 rounded-xl border border-amber-200 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-amber-800 font-medium">Urgent</span>
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
    <div className="hover-tilt max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 mb-1">CRITICAL</div>
          <div className="text-[11px] text-red-400 mb-3">Urgent + Important</div>
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

        <div className="bg-amber-100/80 border border-amber-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-amber-700 mb-1">DELEGATE</div>
          <div className="text-[11px] text-amber-500 mb-3">
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

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-stone-500 mb-1">BACKLOG</div>
          <div className="text-[11px] text-stone-400 mb-3">Neither</div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-stone-500">
              Busy work
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-stone-500">
              Time wasters
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          → Your top 4, surfaced automatically
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
    <div
      className="hover-tilt bg-[#FFFDF7] rounded-2xl p-6 max-w-sm"
      style={{
        border: "1px solid rgba(180, 83, 9, 0.2)",
        boxShadow: "0 8px 30px rgba(120, 53, 15, 0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-slate-800">Today&apos;s Focus</span>
        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
          <span className="text-sm leading-none">&#x1F525;</span>
          <span className="text-xs font-bold text-orange-600">7</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-amber-50/70 border-l-[3px] border-yellow-500 rounded-xl"
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
    title: "Empty your head.",
    description:
      "Drop tasks in as they come. One field, two simple questions: is it important? Is it urgent? Friday holds the rest so you don't have to.",
    Visual: AddTaskVisual,
  },
  {
    step: "02",
    title: "Friday sorts the noise.",
    description:
      "Behind the scenes, every task is scored using the Eisenhower Matrix — importance, urgency, and deadline pressure, all weighed for you.",
    Visual: MatrixVisual,
  },
  {
    step: "03",
    title: "Wake up to four things.",
    description:
      "Each morning your top four are waiting — chosen for you based on what matters most. No decision fatigue. No guilt about the rest. A clear, calm starting point.",
    Visual: TodaysFocusVisual,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="three-acts"
      className="py-20 md:py-28"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #fed7aa 0%, #fef3c7 30%, #FFFDF7 100%)",
      }}
    >
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-16 md:mb-20">
            <p className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-700 mb-4">
              Three Acts
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-slate-900 leading-tight">
              Friday is built around{" "}
              <em className="font-normal text-amber-900">
                one daily ritual.
              </em>
            </h2>
          </div>
        </FadeIn>

        <div className="max-w-5xl mx-auto">
          {acts.map((act, index) => (
            <FadeIn key={act.step} delay={index * 100}>
              <div
                className="grid lg:grid-cols-[80px_1fr_minmax(0,360px)] gap-6 lg:gap-12 items-center py-10 lg:py-14"
                style={{
                  borderTop: "1px solid rgba(120, 53, 15, 0.15)",
                  borderBottom:
                    index === acts.length - 1
                      ? "1px solid rgba(120, 53, 15, 0.15)"
                      : undefined,
                }}
              >
                {/* Chapter number */}
                <div className="font-display italic font-normal text-4xl md:text-5xl text-amber-700">
                  {act.step}
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
                    {act.title}
                  </h3>
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-lg">
                    {act.description}
                  </p>
                </div>

                {/* Visual */}
                <div className="lg:justify-self-end">
                  <act.Visual />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Reload `http://localhost:3000` and scroll to the Three Acts section.**

Expected:
- Section header eyebrow: `THREE ACTS` (letter-spaced).
- Section title: `Friday is built around one daily ritual.` with italic emphasis on "one daily ritual."
- Three rows, each with: italic chapter number (`01` / `02` / `03`) on the left in amber, headline + body in the middle, product visual on the right.
- Headlines: `Empty your head.` / `Friday sorts the noise.` / `Wake up to four things.`
- Hairline warm dividers between rows.
- Section background gradient: peach at top → cream at bottom.
- Visual cards (AddTask, Matrix, TodaysFocus) now sit on the cream `#FFFDF7` instead of pure white, with warm-tinted borders.
- The hash anchor `#three-acts` is reachable: clicking the hero's `See how it works ↓` link should smooth-scroll here.

- [ ] **Step 3: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 4: Commit.**

```bash
git add components/landing/how-it-works-section.tsx
git commit -m "feat(landing): reframe How It Works as Three Acts with cinematic typography"
```

---

## Task 5: Add the Mid-page CTA

**Files:**
- Create: `components/landing/mid-cta-section.tsx`
- Modify: `app/page.tsx` (insert between `HowItWorksSection` and `TrustSignalSection`)

A quiet single-row CTA between Three Acts and the Eisenhower quote. Catches peak engagement right after the visitor understands what Friday does.

- [ ] **Step 1: Create `components/landing/mid-cta-section.tsx` with this code.**

```tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

export function MidCtaSection() {
  return (
    <section
      className="bg-[#FFFDF7] border-t"
      style={{ borderColor: "rgba(180, 83, 9, 0.1)" }}
    >
      <div className="container mx-auto px-6 py-12 md:py-16">
        <FadeIn>
          <div className="text-center">
            <p className="font-display italic text-2xl md:text-3xl font-medium text-slate-900 mb-6">
              Want this for your tomorrow?
            </p>
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="cta-hover px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
                >
                  Begin Friday
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <span className="text-xs text-slate-500">
                60-second setup, free forever
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Open `app/page.tsx`. Add the import.**

Find:
```tsx
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
```

Add immediately below it:
```tsx
import { MidCtaSection } from "@/components/landing/mid-cta-section";
```

- [ ] **Step 3: Insert the section in the page body.**

Find:
```tsx
        <HowItWorksSection />
        <TrustSignalSection />
```

Replace with:
```tsx
        <HowItWorksSection />
        <MidCtaSection />
        <TrustSignalSection />
```

- [ ] **Step 4: Reload and verify.**

Expected:
- Between Three Acts and the Eisenhower quote, a quiet single-row CTA section.
- Italic display serif: `Want this for your tomorrow?`
- Same `Begin Friday →` button.
- Microcopy `60-second setup, free forever` to the right of the button.

- [ ] **Step 5: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 6: Commit.**

```bash
git add components/landing/mid-cta-section.tsx app/page.tsx
git commit -m "feat(landing): add mid-page CTA between Three Acts and quote"
```

---

## Task 6: Restyle the Eisenhower quote section

**Files:**
- Modify: `components/landing/trust-signal-section.tsx`

New eyebrow `— A NOTE FROM 1954 —`, drop the oversized decorative quotation mark, peach gradient background. The component file stays under its current name to keep the diff small.

- [ ] **Step 1: Replace the entire contents of `components/landing/trust-signal-section.tsx` with this code.**

```tsx
import { FadeIn } from "./fade-in";

export function TrustSignalSection() {
  return (
    <section
      className="py-16 md:py-20"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #fb923c 0%, #fdba74 30%, #fed7aa 100%)",
      }}
    >
      <div className="container mx-auto px-6">
        <FadeIn>
          <blockquote className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
            <div className="font-display italic text-[11px] md:text-xs tracking-[0.3em] uppercase text-amber-900/70">
              — A Note from 1954 —
            </div>
            <p className="font-display text-2xl md:text-3xl italic font-normal leading-snug text-amber-950">
              &ldquo;What is important is seldom urgent, and what is urgent is
              seldom important.&rdquo;
            </p>
            <footer className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-900">
              Dwight D. Eisenhower
            </footer>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Reload and verify.**

Expected:
- Section now lives between the mid-CTA and the (still-current) FinalCTASection.
- Background is a peach gradient (warmer than before).
- Top eyebrow: italic `— A NOTE FROM 1954 —`, letter-spaced.
- Quote in display serif italic, larger than before, dark-warm color.
- Attribution: `DWIGHT D. EISENHOWER` (letter-spaced caps).
- The previous oversized open-quote glyph (`"`) is gone.

- [ ] **Step 3: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 4: Commit.**

```bash
git add components/landing/trust-signal-section.tsx
git commit -m "feat(landing): promote Eisenhower quote with peach gradient + 1954 framing"
```

---

## Task 7: Add the FAQ section

**Files:**
- Create: `components/landing/faq-section.tsx`
- Modify: `app/page.tsx` (insert between `TrustSignalSection` and `FinalCTASection`)

Four Q&As, each defusing a different objection. Quiet visual treatment so it doesn't break the cinematic aesthetic.

- [ ] **Step 1: Create `components/landing/faq-section.tsx` with this code.**

```tsx
import { FadeIn } from "./fade-in";

const faqs = [
  {
    q: "How is Friday different from Todoist or Things?",
    a: "Other apps hold your list. Friday picks your top four. We don't add features — we add clarity. If you've ever opened Todoist and felt overwhelmed, that's the gap Friday fills.",
  },
  {
    q: "What if I have more than 4 important tasks?",
    a: "You probably don't. Friday's whole job is helping you accept that. The rest go in the backlog and surface on the day they belong on. This is the discipline.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Free forever for personal use. No card, no upgrade screen, no team plan to upsell you on.",
  },
  {
    q: "What about my data?",
    a: "Stored encrypted on Supabase. We never sell, share, or use your tasks to train anything. No tracking pixels. No analytics on your task content.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-[#FFFDF7] py-16 md:py-24">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-700 mb-3">
              Common Questions
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-slate-900">
              Before you sign up.
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {faqs.map((item, i) => (
              <div
                key={item.q}
                className={
                  i < faqs.length - 1
                    ? "pb-6 border-b"
                    : ""
                }
                style={
                  i < faqs.length - 1
                    ? { borderColor: "rgba(180, 83, 9, 0.15)" }
                    : undefined
                }
              >
                <h3 className="font-display text-lg md:text-xl font-semibold text-slate-900 mb-2">
                  {item.q}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Open `app/page.tsx`. Add the import.**

Find:
```tsx
import { TrustSignalSection } from "@/components/landing/trust-signal-section";
```

Add immediately below it:
```tsx
import { FaqSection } from "@/components/landing/faq-section";
```

- [ ] **Step 3: Insert the section in the page body.**

Find:
```tsx
        <TrustSignalSection />
        <FinalCTASection />
```

Replace with:
```tsx
        <TrustSignalSection />
        <FaqSection />
        <FinalCTASection />
```

- [ ] **Step 4: Reload and verify.**

Expected:
- Between the Eisenhower quote and the Final CTA, a centered FAQ section.
- Eyebrow `COMMON QUESTIONS`, title `Before you sign up.` in display serif.
- Four Q&As stacked vertically, each separated by a thin warm divider (no divider after the last one).
- Questions in display serif weight 600, answers in body sans, slate-600.
- Cream background (page returns to its starting tone before the final CTA).

- [ ] **Step 5: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 6: Commit.**

```bash
git add components/landing/faq-section.tsx app/page.tsx
git commit -m "feat(landing): add FAQ section with 4 objection-defusing Q&As"
```

---

## Task 8: Revise the Final CTA section

**Files:**
- Modify: `components/landing/final-cta-section.tsx`

Mirror the hero's gradient + sun glow, swap copy to the cinematic two-line headline.

- [ ] **Step 1: Replace the entire contents of `components/landing/final-cta-section.tsx` with this code.**

```tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

export function FinalCTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Sunrise gradient (mirrors the hero) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFDF7 0%, #fef3c7 30%, #fcd34d 65%, #fb923c 100%)",
        }}
        aria-hidden="true"
      />

      {/* Sun glow */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-72 w-[140%] aspect-square rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, #fffbeb 0%, #fef3c7 30%, #fcd34d 55%, #f59e0b 80%, transparent 95%)",
          boxShadow: "0 0 140px rgba(251, 191, 36, 0.6)",
        }}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="font-display text-4xl md:text-6xl font-semibold leading-[0.95] tracking-tight text-slate-900"
              style={{ letterSpacing: "-0.03em" }}
            >
              It&apos;s Friday.
            </h2>
            <h2
              className="font-display text-4xl md:text-6xl font-normal italic leading-[0.95] tracking-tight text-amber-900 mt-1"
              style={{ letterSpacing: "-0.03em" }}
            >
              Lighten the load.
            </h2>

            <Link href="/auth/sign-up" className="inline-block mt-8">
              <Button
                size="lg"
                className="cta-hover px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
              >
                Begin Friday
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <p className="mt-3 text-xs text-amber-950/80 font-medium">
              Free forever · No card · 60-second setup
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Reload and verify.**

Expected:
- Final section before the footer.
- Same warm gradient + sun glow as the hero (page closes the way it opens).
- Two-line headline in display serif: `It's Friday.` + italic `Lighten the load.`
- Same `Begin Friday →` button + microcopy.
- No leftover styling from the previous `bg-gradient-to-br from-amber-50 to-orange-50` — fully replaced.

- [ ] **Step 3: Lint.**

Run: `npm run lint`
Expected: Passes.

- [ ] **Step 4: Commit.**

```bash
git add components/landing/final-cta-section.tsx
git commit -m "feat(landing): rewrite final CTA with sunrise gradient closer"
```

---

## Task 9: Header CTA copy + final verification

**Files:**
- Modify: `app/page.tsx` (header button copy alignment)

Today the header button says `Get Started`. Aligning it to the new primary CTA voice (`Get started` → keep lowercased, but it's worth confirming consistency). The Login link can stay. Then we run a full pass: lint, build, browser walkthrough.

- [ ] **Step 1: Open `app/page.tsx`. Locate the header CTA button (around line 32-33).**

Current:
```tsx
            <Link href="/auth/sign-up">
              <Button className="cta-hover bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium">
                Get Started
              </Button>
            </Link>
```

Replace with:
```tsx
            <Link href="/auth/sign-up">
              <Button className="cta-hover bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium">
                Get started
              </Button>
            </Link>
```

(Style now matches the in-page CTAs — slate button with cream text — for visual consistency. The yellow header button would clash with the new dark-button visual language used everywhere else.)

- [ ] **Step 2: Verify the full page in the browser.**

Reload `http://localhost:3000` and walk through top-to-bottom. Expected order:

1. **Header**: friday logo + Login + slate `Get started` button.
2. **Hero**: cinematic split, sunrise gradient, product peek card.
3. **Trust strip**: 5 anti-feature pills + founder subline.
4. **Three Acts**: numbered chapter rows, peach → cream gradient.
5. **Mid-CTA**: `Want this for your tomorrow?` + button.
6. **Eisenhower quote**: peach gradient, `— A NOTE FROM 1954 —`.
7. **FAQ**: `Before you sign up.` + 4 Q&As.
8. **Final CTA**: sunrise gradient mirror, `It's Friday. / Lighten the load.`
9. **Footer**: unchanged.

Confirm CTA links work:
- All `Begin Friday` / `Get started` buttons link to `/auth/sign-up`.
- Hero `See how it works ↓` smooth-scrolls to the Three Acts section.

Confirm responsive:
- Resize browser to ~375px width. Hero should stack to a single column. Three Acts should stack number-text-visual vertically. All other sections should reflow cleanly.

- [ ] **Step 3: Lint.**

Run: `npm run lint`
Expected: Passes with no new warnings.

- [ ] **Step 4: Build.**

Run: `npm run build`
Expected: Build succeeds. No TypeScript errors. No new warnings.

- [ ] **Step 5: Stop the dev server.**

In the terminal where `npm run dev` is running, press `Ctrl+C`.

- [ ] **Step 6: Final commit.**

```bash
git add app/page.tsx
git commit -m "feat(landing): unify header CTA with slate-button voice"
```

- [ ] **Step 7: Confirm the full diff against `main`.**

Run: `git log --oneline main..HEAD`
Expected: Eight commits listed (Tasks 1-8 plus this final one).

```
[hash] feat(landing): unify header CTA with slate-button voice
[hash] feat(landing): rewrite final CTA with sunrise gradient closer
[hash] feat(landing): add FAQ section with 4 objection-defusing Q&As
[hash] feat(landing): promote Eisenhower quote with peach gradient + 1954 framing
[hash] feat(landing): add mid-page CTA between Three Acts and quote
[hash] feat(landing): reframe How It Works as Three Acts with cinematic typography
[hash] feat(landing): add anti-feature trust strip below hero
[hash] feat(landing): rewrite hero with cinematic split + product peek
[hash] feat(landing): add .font-display utility for cinematic serif headlines
```

---

## Out of scope (do NOT do during this plan)

- Mobile-specific design polish beyond standard responsive grid stacking. The default Tailwind breakpoints (sm/md/lg) handle the layouts; pixel-perfect mobile tuning is a follow-up.
- Renaming `trust-signal-section.tsx` to `eisenhower-quote-section.tsx`. The internal naming is misleading after this redesign but a rename is a separate refactor.
- Removing the existing `hero-section.tsx` looping-animation infrastructure beyond what this plan deletes (the new file replaces it entirely; no other files referenced it).
- Adding analytics events to the new CTAs. Tracking is a separate spec (`marketing-skills:analytics-tracking`).
- A/B testing infrastructure for headline variants.
- Adding real testimonials or user counts. Pre-launch — anti-feature framing carries trust until those exist.
- Internationalization / i18n.
