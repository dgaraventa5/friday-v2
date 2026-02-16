# Landing Page Redesign — "The Exhale"

**Date:** 2026-02-15
**Status:** Approved
**Goal:** Redesign the Friday landing page from a template-y, cold, card-heavy layout into a warm, human, editorially-crafted experience that converts significantly better.

## Decisions

- **Vibe:** Warm & human — friendly, approachable, calm. Emphasizes relief from stress.
- **Scope:** Full restructure — merge/cut redundant sections, reorder for narrative flow, redesign layouts from scratch. Keep good copy, trash bad layouts.
- **Social proof:** Remove fake testimonials entirely. Replace with a lightweight trust signal strip. Add real testimonials later.
- **Hero animation:** Rebuild as a polished, looping animation (task list → focused 4). Always alive.
- **Dark mode:** Removed from all landing page components. Light only.
- **Section count:** 7 → 5 (Hero, Problem, How It Works, Trust Signal, Final CTA)

## Visual Foundation

### Color Palette

- **Base background:** Warm cream (`#FFFDF7` / `#FEF9EF`) instead of cold `slate-50`
- **Text:** Warm near-black (`slate-900`) for headlines, warm `slate-600` for body
- **Brand accent:** Keep `yellow-500` (#FDE047) as primary
- **Warm accents:** Soft amber/peach tones for alternating section backgrounds
- **No hard borders:** Use soft warm shadows and background color shifts instead of `border-slate-200`

### Typography

- Hero headline: `text-5xl md:text-7xl`, tight tracking, `font-bold`
- Section headings: `text-3xl md:text-5xl`, `font-semibold`
- Body: `text-lg` with `leading-relaxed`, max-width ~600px for readability
- Much bolder hierarchy than current — let headings dominate

### Spacing

- Sections: `py-24 md:py-36` (up from `py-16 md:py-24`) — unhurried feel
- Generous vertical breathing room between all elements
- Content max-widths tightened for readability

### Visual Elements

- Soft warm-tinted shadows (not gray)
- Rounded corners: `rounded-2xl` / `rounded-3xl` on cards
- No hard borders — shadows and background shifts for separation
- Subtle radial gradients for warmth (warm amber glow behind key elements)

## Section 1: Hero

**Layout:** Two columns on desktop (text left, animation right). Stacked on mobile (text top, animation below).

### Left Column

- **No logo** in hero body (already in the header — de-duplicate)
- **Headline:** "Every day, just 4 things that matter."
  - Specific, intriguing, communicates the unique mechanism (the number 4)
- **Sub-headline:** "Friday uses the Eisenhower Matrix to cut through your overwhelming to-do list and surface the tasks that actually move your life forward."
  - Names the framework (credibility), the pain (overwhelming to-do list), the outcome (move your life forward)
- **Primary CTA:** "Start Focusing" button → `/auth/sign-up`
- **Secondary CTA:** "See How It Works" → smooth-scroll to Section 3
- **Trust line:** "Free forever. No credit card required."

### Right Column — Looping Animation

Warm-shadowed card with `rounded-3xl`, generous padding.

- **Phase 1 (3s):** ~8 tasks in a dense list. Header: "Your Tasks" with count badge
- **Phase 2 (2s):** List softly blurs/fades. Divider appears. Below it, 4 tasks gracefully rise into "Today's Focus" with warm yellow left-border accents. Transition should feel like a sigh of relief
- **Phase 3 (3s):** Hold on the clean "Today's Focus" state
- **Phase 4 (1s):** Soft crossfade back to Phase 1
- Total loop: ~9 seconds. Always alive.

### Background

Warm cream base with a subtle radial gradient (warm amber glow behind the animation card).

## Section 2: Problem / Empathy

**Purpose:** The "yes, that's me" moment. Brief, punchy, emotional.

**Layout:** Centered, single-column. No cards, no grids, no icons. Pure editorial typography.

### Structure

- **Heading:** "Sound familiar?"
- **Three pain points** as standalone large text statements (`text-xl md:text-2xl`, warm `slate-700`):
  1. "Your to-do list keeps growing, but nothing gets done."
  2. "You spend more time organizing tasks than actually doing them."
  3. "By 3pm, you're busy but can't name one important thing you finished."
- Subtle yellow accent (dot or dash) before each statement. Generous vertical spacing.
- **Transition line** below, slightly smaller/lighter: "It's not a discipline problem. It's a prioritization problem."
  - Reframes self-blame into a solvable problem — emotional bridge to the solution

### Background

Same warm cream as hero, or very subtle shift to slightly warmer/deeper cream.

## Section 3: How Friday Works

**Purpose:** The merged narrative. Combines current ValueProps + HowItWorks + EisenhowerMatrix into one flowing story.

**Section header:**
- Heading: "How Friday works"
- Sub-heading: "Three steps. No learning curve."

### Act 1: "Dump everything in"

- **Layout:** Text left, visual right
- **Copy:** Add tasks with a name, category (work/health/personal/home), and two simple toggles: important? urgent? No complex project management.
- **Visual:** Stylized mockup of the add-task form. Warm card with soft shadow. Shows category and importance/urgency toggles.

### Act 2: "Friday finds what matters"

- **Layout:** Text right, visual left (alternating rhythm)
- **Copy:** Introduces the Eisenhower Matrix naturally within the story. "Behind the scenes, Friday uses the Eisenhower Matrix — the same framework used by presidents and CEOs for decades — to score every task by importance, urgency, and deadline pressure. It automatically schedules your day so the right things get done first."
- **Visual:** Redesigned 2x2 Eisenhower Matrix grid. Red (Q1 Critical), Blue (Q2 Plan), Amber (Q3 Delegate), Soft gray (Q4 Eliminate). 1-2 example tasks per quadrant. Small callout badge: "→ Your top 4, surfaced automatically"
- **Eisenhower quote** as subtle blockquote below: "What is important is seldom urgent, and what is urgent is seldom important."

### Act 3: "Focus on just 4 things today"

- **Layout:** Text left, visual right
- **Copy:** The payoff. "Every morning, Friday shows you exactly 4 tasks. Not 12. Not 30. Just the 4 that will make the biggest impact today. Complete them, and tomorrow's 4 are ready." Brief bullet points for supporting features: recurring tasks, streak tracking, category balance.
- **Visual:** Polished "Today's Focus" card — 4 tasks with yellow left-borders, checkboxes, category pills, streak indicator (flame + "7 day streak").

### Spacing

`space-y-24 md:space-y-32` between acts. Each act feels like turning a page.

### Background

Slightly different warm tone — faintest warm amber tint, or pure white with warm shadows. New chapter feel.

## Section 4: Trust Signal

**Purpose:** Lightweight transitional moment. Not a full section — a breathing point.

**Layout:** Centered, compact. `py-16 md:py-20`.

### Structure

- **Single line,** centered, `text-lg`, warm `slate-500`: "Built on a framework trusted by presidents, executives, and top performers for over 70 years."
- **Trust markers** below, `slate-400`, separated by dots: "Free forever · No credit card · Set up in 60 seconds"

No cards, no fake faces, no star ratings. When real testimonials exist, they go here.

### Background

Same as section above or faintest shift. Should not feel like its own section — just a quiet pause.

## Section 5: Final CTA

**Purpose:** Convert. The reader has been seen, understands the solution, and has built trust.

### Background

Soft warm gradient — gentle warm amber to soft peach, or solid warm `yellow-50`. Inviting, not alarming. Much softer than the current harsh yellow-to-orange.

### Structure

- **Headline:** "Ready to focus on what actually matters?" — `text-3xl md:text-5xl`, `font-bold`, warm dark text
- **Sub-headline:** "Start with today's 4 most important tasks."
- **Primary CTA:** "Get Started Free" — large button, `slate-900` background, white text → `/auth/sign-up`
- **Secondary CTA:** "Sign up with Google" — outlined button with Google icon → `/auth/sign-up`
- **Trust line:** "Free forever · No credit card · 60 seconds to start"

### Changes from current

- Email input form removed (friction reduction)
- Gradient toned way down
- Copy simplified and conversational
- Much less cluttered: headline, sub-headline, two buttons, trust line

## Header & Footer

- **Header:** Keep current structure (logo left, Login + Get Started right). Warm up background from white to match the cream base. Remove dark mode classes.
- **Footer:** Keep structure. Warm up colors to match new palette. Remove dark mode classes.

## Files Affected

- `app/page.tsx` — Update section order, remove deleted sections
- `components/landing/HeroSection.tsx` — Full rewrite (animation + layout + copy)
- `components/landing/ProblemSection.tsx` — Full rewrite (editorial typography)
- `components/landing/HowItWorksSection.tsx` — Full rewrite (3-act narrative, absorbs ValueProps + EisenhowerMatrix content)
- `components/landing/FinalCTASection.tsx` — Significant rewrite (simplified, warmed up)
- `components/landing/ValuePropsSection.tsx` — Delete (absorbed into HowItWorksSection)
- `components/landing/EisenhowerMatrixSection.tsx` — Delete (absorbed into HowItWorksSection)
- `components/landing/SocialProofSection.tsx` — Delete (replaced by trust signal in page.tsx or a new TrustSignalSection.tsx)
- New: `components/landing/TrustSignalSection.tsx` — Lightweight trust strip
