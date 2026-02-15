# Onboarding Experience Design — v1

**Date:** 2026-02-14
**Status:** Approved
**Approach:** Connected Journey (Approach B)
**Reference:** `docs/friday-onboarding-prd.md`

---

## Summary

A 4-screen onboarding flow that gets new users from sign-up to seeing their first task classified in the Eisenhower Matrix in under 90 seconds. The key design enhancement over the base PRD is a **connected journey** — the user's task card is a shared visual element that travels between screens via Framer Motion `layoutId`, creating an emotional arc that builds to the matrix reveal.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Lean 4 screens (no personalization) | Get to aha moment fastest. Personalization deferred to v1.1. |
| Animation library | Framer Motion (install) | Spring physics, shared layout animations, orchestrated sequences, reduced-motion support |
| Reveal animation | Task card flies into quadrant from above | More delightful than appearing in place; the user sees their classification map to a position |
| Task persistence | Insert on reveal page load | User gets their task even if they close the tab before clicking "go to dashboard" |
| Auth redirect | Dashboard guard only | Don't modify auth flow. Dashboard checks onboarding status and redirects new users. Clean separation of concerns. |

## Flow

```
/onboarding/welcome  →  /onboarding/task  →  /onboarding/classify  →  /onboarding/reveal  →  /dashboard
    (10 sec)               (30 sec)              (20 sec)                (15 sec)
```

Total: ~75 seconds. One task created. One moment of delight.

---

## Architecture

### Route structure

```
/onboarding/welcome   → Welcome screen
/onboarding/task      → Task input (title + due date)
/onboarding/classify  → Importance + urgency toggles
/onboarding/reveal    → Matrix reveal + celebration
```

### State management

- `useOnboarding()` hook — single source of truth for onboarding state
- Wizard state persisted to `onboarding_progress` table on each step advance
- Local React state for in-progress form values; persisted on "continue" click
- Task inserted into `tasks` table on reveal page load

### Route protection (dashboard guard)

In `dashboard-client.tsx` on mount:

1. Load `onboarding_progress` for the user
2. If no record + no tasks → redirect to `/onboarding/welcome` (new user)
3. If no record + has tasks → auto-create `completed` record (existing pre-feature user)
4. If `status === 'in_progress'` → redirect to `current_step`
5. If `status === 'completed'` → render dashboard

In `app/onboarding/layout.tsx`: if `status === 'completed'`, redirect to `/dashboard`.

Each page validates its prerequisites from `progress` and redirects backward if data is missing.

### Database

Single new table: `onboarding_progress` (see PRD for full schema).

Simplified step enum: `welcome | task_input | classify | reveal | done`.

Wizard state columns: `wizard_task_title`, `wizard_due_date`, `wizard_due_date_preset`, `wizard_importance`, `wizard_urgency`.

### Types

Update existing `OnboardingStep` and `OnboardingProgress` in `lib/types.ts` to match simplified schema.

---

## Screen Designs

### Screen 1: Welcome (`/onboarding/welcome`)

Full viewport, centered, no nav.

**Content:**
- Friday sun logo (`SunLogo`, 48px)
- "focus on what matters most." (headline, bold, lowercase)
- "we'll help you sort through the noise and zero in on your top priorities — starting with the one thing on your mind right now." (body)
- "let's go →" (yellow CTA button)
- "takes about 60 seconds" (muted hint)

**Animation:** Staggered fade-in on mount (logo → headline → body → button → hint). Each child: opacity 0→1, y: 10→0, 600ms ease-out, stagger ~100ms.

**Behavior:** "let's go" → `advanceToStep('task_input')` → `router.push('/onboarding/task')`. If resuming, redirect to `current_step`.

### Screen 2: Task Input (`/onboarding/task`)

**Nav:** "← back" (left), "step 1 of 3" (right, muted)

**Progress bar:** Thin yellow bar at top, 33% width.

**Content:**
- "what's the one thing you need to get done?" (headline)
- Text input, auto-focused, placeholder "e.g., finish the quarterly report"
- "when does it need to happen?" (label)
- Due date pills (flex-wrap): `today | tomorrow | this week | someday | pick a date...`
  - Outline by default, yellow fill when selected
  - "pick a date" opens native date input or existing calendar picker
  - "someday" = null due date
- "continue →" (disabled until title has ≥1 non-whitespace char, due date optional)

**Task card preview:** Once the user types a title, a card preview fades in showing title + selected due date. This card uses Framer Motion `layoutId="task-card"` — it's the shared element that travels to screen 3 and 4.

**Animation:** Page slides in from right (x: 30→0, opacity 0→1, 300ms).

**Behavior:** "continue" → persist title + due date via `advanceToStep('classify', {...})` → `router.push('/onboarding/classify')`.

### Screen 3: Classification (`/onboarding/classify`)

**Nav:** "← back" → `/onboarding/task` (does NOT update `current_step`). "step 2 of 3".

**Progress bar:** 66% width.

**Content:**
- "let's prioritize it." (headline)
- Task summary card (`layoutId="task-card"`) — animates from screen 2 position. Shows title + due date. Yellow left border, light background.
- **Importance toggle:**
  - "is it important?" + "tasks that directly impact your goals."
  - Buttons: "important" | "not important"
  - Micro-interaction: selecting "important" triggers a warm shimmer (background gradient sweep, 400ms)
- **Urgency toggle:**
  - "is it urgent?" + "tasks that can't wait — they need attention now."
  - Buttons: "urgent" | "not urgent"
  - Micro-interaction: selecting "urgent" triggers a quick pulse (scale 1→1.05→1, 200ms)
- "see where it lands →" (disabled until both selected)

**Animation:** Page slides in from right. Task card shared layout transition.

**Behavior:** "see where it lands" → persist importance + urgency via `advanceToStep('reveal', {...})` → `router.push('/onboarding/reveal')`.

### Screen 4: Matrix Reveal (`/onboarding/reveal`)

**No back button. No step indicator.** Progress bar at 100%.

**Animation sequence:**

| Time | Event |
|------|-------|
| 0ms | Page fades in. "nice — you've got this." headline appears |
| 200ms | 2×2 matrix grid fades in (four quadrants with names + subtitles) |
| 500ms | Three non-active quadrants dim to 40% opacity |
| 700ms | Task card flies in — starts centered above the matrix, springs into correct quadrant (`layoutId="task-card"`, Framer Motion spring) |
| 900ms | Radial glow pulses from task card (CSS box-shadow, quadrant-specific color, 600ms) |
| 1500ms | Glow fades, other quadrants return to full opacity |
| 1700ms | Explanation text fades in below matrix (quadrant-specific copy) |
| 2000ms | "go to my dashboard →" button fades in |

**Matrix grid:** CSS Grid 2×2.

| Quadrant | Color | Label | Subtitle |
|----------|-------|-------|----------|
| Critical (urgent + important) | red | "critical" | "do first" |
| Plan (important, not urgent) | blue | "plan" | "schedule it" |
| Urgent (urgent, not important) | amber | "urgent" | "delegate or batch" |
| Backlog (neither) | slate | "backlog" | "drop it?" |

**Glow colors:**
- Critical: `rgba(239, 68, 68, 0.15)` (red-500)
- Plan: `rgba(59, 130, 246, 0.15)` (blue-500)
- Urgent: `rgba(245, 158, 11, 0.15)` (amber-500)
- Backlog: `rgba(100, 116, 139, 0.15)` (slate-500)

**Task insertion:** On mount, `createTaskAndComplete()` fires — inserts task + marks onboarding complete. CTA just navigates.

**Reduced motion:** Skip all animation. Render matrix + task in position + explanation + button immediately.

**Quadrant-specific copy:** (see PRD `ONBOARDING_COPY.reveal.quadrants` for exact text).

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Refresh mid-flow | `useOnboarding()` loads from DB. Fields pre-populate. Shared element animation won't play but content appears correctly. |
| Close tab on reveal, reopen | Task already created. `status = 'completed'`. Dashboard renders with task visible. |
| Close tab on classify, reopen | `current_step = 'classify'`. Dashboard guard redirects. Task card populates from DB. |
| Network error creating task | Toast: "something went wrong — let's try again" + retry button. Don't mark complete. |
| Existing pre-feature user | Dashboard: no record + has tasks → auto-create `completed` record. |
| Direct URL to later step | Each page validates prerequisites, redirects backward if missing. |
| Completed user visits `/onboarding/*` | Layout guard redirects to `/dashboard`. |
| Dark mode | All colors use Tailwind `dark:` variants. |
| Whitespace-only title | Button stays disabled. |
| Auth session expires | `getUser()` returns null → redirect to `/auth`. On re-auth, dashboard guard resumes. |

## Error Handling

- **DB write failures:** Silent retry once, then toast with "having trouble saving — try again".
- **Task creation failure on reveal:** Inline error below matrix with retry. Don't navigate away.
- **Auth expiry:** Redirect to `/auth`. Onboarding state preserved in DB.

## Mobile

- All screens: `max-w-md mx-auto px-6`
- Due date pills: `flex-wrap` for natural wrapping
- Toggle buttons: full-width on mobile (`w-full sm:w-auto`)
- Matrix grid: tighter padding on mobile, truncate long task titles
- Touch targets: ≥44px
- No horizontal scroll

## Accessibility

- `prefers-reduced-motion`: all animations disabled, content renders immediately
- Auto-focus title input on screen 2
- `aria-disabled` on disabled buttons
- Color contrast: WCAG AA
- Progress bar: `role="progressbar"` with `aria-valuenow`

---

## File Inventory

```
NEW FILES:
1. hooks/use-onboarding.ts                  — onboarding state hook
2. app/onboarding/layout.tsx                — clean full-screen layout + completed-user guard
3. app/onboarding/welcome/page.tsx          — welcome screen
4. app/onboarding/task/page.tsx             — task input (title + due date)
5. app/onboarding/classify/page.tsx         — importance + urgency toggles
6. app/onboarding/reveal/page.tsx           — matrix reveal + celebration

MODIFIED FILES:
7. lib/types.ts                             — update OnboardingStep + OnboardingProgress types
8. components/dashboard/dashboard-client.tsx — add onboarding redirect guard

NEW DEPENDENCY:
9. framer-motion                            — animation library

DATABASE:
10. Migration: add_onboarding_progress      — new table (SQL in PRD)
```

## Copy Reference

All user-facing text lives in `ONBOARDING_COPY` constant (see PRD for complete reference).

---

## What's Deferred

- **v1.1:** Personalization question, onboarding checklist widget, skip option
- **v1.2:** Contextual prompts (Day 2/3/7), notification permission, calendar connection
- **v2.0:** AI-suggested quadrant, personalization-driven variants, A/B testing
