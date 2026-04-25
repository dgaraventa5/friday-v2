# Friday Landing Page Redesign — Design Spec

**Date:** 2026-04-25
**Status:** Approved for implementation
**Scope:** Marketing landing page only (`/` route). Auth, dashboard, and product UI are out of scope.

---

## 1. Goal

Reimagine Friday's landing page in a more distinctive, ownable visual direction while improving conversion for both warm (Twitter, word-of-mouth) and cold (SEO) traffic.

The redesign keeps:

- The sun logo (existing `Sun` icon, `text-yellow-500`)
- The brand color foundation (yellow / amber / cream / slate)
- The core messaging from `docs/friday-messaging-positioning.md`

The redesign changes:

- Visual direction: from generic warm SaaS landing → cinematic "page-as-sunrise"
- Headline copy: poetic + specific hybrid
- Page flow: brand + product → trust → how it works → CTA → philosophy → objections → CTA
- Adds three new sections: trust strip, mid-page CTA, FAQ

---

## 2. Design direction

**The whole page reads like a single sunrise.** Each section's background sits somewhere on the gradient cream (`#FFFDF7`) → amber (`#fef3c7` / `#fcd34d`) → peach (`#fb923c`). Scrolling = time of day; the product is the metaphor.

### Personality

Confident but warm. Cinematic typography (display serif headlines with italic counter-lines), generous whitespace, sun glow as a recurring atmospheric element. Anti-feature trust signaling instead of fake-metric social proof.

### Type system

| Role | Family | Notes |
|---|---|---|
| Display headline | `'Iowan Old Style', 'Palatino', Georgia, serif` | Used for hero, mid-CTA, Eisenhower quote, final CTA. Mix of regular weight + italic counter-lines. Tight letter-spacing (`-0.025em` to `-0.035em`). |
| Body / UI | `system-ui` (existing) | Same as today. |
| Eyebrow / labels | `system-ui` | Bold, all caps, letter-spaced `0.32em`. Used as scene markers. |

### Color palette (Tailwind tokens)

| Use | Value |
|---|---|
| Page base | `#FFFDF7` (existing cream) |
| Amber light | `amber-100` `#fef3c7` |
| Amber mid | `amber-300` `#fcd34d` |
| Peach | `orange-400` `#fb923c` |
| Sun glow center | `amber-50` `#fffbeb` |
| Headline dark | `slate-900` `#0f172a` |
| Headline warm | `amber-900` `#78350f` |
| Body text warm | `amber-950` `#422006` |
| Body text cool | `slate-600` `#475569` |
| CTA primary | `slate-900` background, `amber-100` text |
| Border / divider | `rgba(180, 83, 9, 0.15)` (subtle warm) |

The palette stays within the existing brand system — no new hues. The peach/orange-400 already exists in the current `final-cta-section.tsx` gradient.

---

## 3. Page structure

The page is composed of nine sections (header + seven content sections + footer):

1. **Header** (existing, unchanged structurally)
2. **Hero** (revised — asymmetric split with product peek)
3. **Trust strip** (NEW)
4. **Three Acts** (revised — was "Simple by design")
5. **Mid-page CTA** (NEW)
6. **Eisenhower quote** (moved from #2 to #6, visually promoted)
7. **FAQ** (NEW)
8. **Final CTA** (revised copy)
9. **Footer** (existing, unchanged)

Each section's background continues the sunrise gradient; section transitions are gradient-to-gradient rather than hard cuts.

---

## 4. Section specifications

### 4.1 Header (unchanged)

Existing `app/page.tsx` header keeps its current structure: sticky, `bg-[#FFFDF7]/90 backdrop-blur-lg`, sun + wordmark on the left, Login + Get Started on the right.

### 4.2 Hero (REVISED)

**Layout:** Asymmetric two-column grid, ~1.3fr / 1fr split. Sunrise gradient + sun glow flow across the entire hero.

**Background:** Vertical gradient `linear-gradient(180deg, #FFFDF7 0%, #fef3c7 38%, #fcd34d 75%, #fb923c 100%)`. A large radial sun glow rises from the bottom-center, ~140% width, with `box-shadow: 0 0 140px rgba(251, 191, 36, 0.55)`. A faint horizon line (single hairline `rgba(120, 53, 15, 0.18)` with horizontal fade) sits where the sun and the rest of the page meet.

**Left column (text):**
- Eyebrow: `A DAILY FOCUS APP` — sans-serif, weight 700, size 12px, letter-spacing `0.32em`, color `#78350f` at 70% opacity.
- Headline line 1: `Less today.` — display serif, weight 600, size `text-6xl md:text-7xl`, color `#0f172a`, letter-spacing `-0.035em`.
- Headline line 2: `More done.` — display serif italic, weight 400, same size, color `#78350f`, same letter-spacing. The italic counter-line is the signature move; both lines stack with negligible gap.
- Subhead: `The to-do list that picks your top four for you, every morning — using the same matrix Eisenhower built to run a continent.` — body sans, size `text-base md:text-lg`, color `#422006` at 88% opacity, max-width ~`max-w-md`.
- Primary CTA: Button, `bg-slate-900 text-amber-100`, label `Begin Friday →`, height ~48px, padding `px-6 py-3`, border-radius `rounded-lg`. Links to `/auth/sign-up`.
- Secondary CTA: Text link `See how it works ↓`, color `#78350f`, underline. Anchor-links to `#three-acts`.
- Microcopy: `Free forever · No card · 60-second setup` — size 12px, color `#422006` at 75% opacity.

**Right column (product peek):**
- A "Today's Focus" card, tilted `-2deg`, with a soft drop shadow (`0 20px 60px rgba(120, 53, 15, 0.18)`).
- Card content (real-feeling, not lorem):
  - Header: `Today's Focus` + streak badge `🔥 7` (warm pill).
  - Four task rows: cream background (`#fef3c7`), 3px yellow left border (`#eab308`), small task names (e.g., `Prepare investor pitch`, `Fix signup flow bug`, `Call Dr. Martinez`, `Review lease agreement`).
  - Footer caption: `Prioritized automatically · 4 of 27 tasks` — italic, slate-400.
- The existing hero animation logic (looping `all tasks → focused 4`) is **dropped**. A static product peek converts better and the cinematic typography is now carrying the "wow" load.

**Reduced motion:** No motion in the hero by default. Optional respectful fade-up on initial mount only (existing `animate-fade-up` utility). The looping animation is gone.

### 4.3 Trust strip (NEW)

**Layout:** Single horizontal row, full-width, padding `py-6 px-9`. Background `#fffbeb` (warm cream), thin warm borders top and bottom (`1px solid rgba(180, 83, 9, 0.1)`).

**Content:** Five anti-feature pills, each a small line:
- `✦ No AI gimmicks`
- `✦ No bloat`
- `✦ No upsells`
- `✦ No tracking`
- `✦ Just clarity`

Pills are not boxed — just inline text with a small yellow `✦` glyph. Layout uses flexbox with `justify-around`, wraps to a 3+2 grid on mobile.

**Subline (centered, below the row):** `Hand-built solo — because every other to-do list got it wrong.` — italic, sans, size 11px, color `#92400e` at 85% opacity.

### 4.4 Three Acts (REVISED — was "Simple by design")

**Section ID:** `#three-acts` (replaces `#how-it-works`).

**Layout:** Same three-step structure as today but reframed as "acts" with cinematic typography.

**Background:** Vertical gradient `linear-gradient(180deg, #fed7aa 0%, #fef3c7 30%, #FFFDF7 100%)` — page cools from peach back to cream as the section progresses.

**Section header:**
- Eyebrow: `THREE ACTS` (replaces "Simple by design").
- Title: `Friday is built around` + italic `one daily ritual.` — display serif, mix of regular and italic weights.

**Each act:** A horizontal row with three internal columns — chapter number on the far left (italic display serif `01` / `02` / `03` in `amber-700`, ~`text-4xl`), text content (headline + body) in the middle, and the existing product visual on the right. Three acts stack vertically with thin warm dividers (`1px solid rgba(120, 53, 15, 0.15)`) between them. This **replaces** the current alternating left/right layout in `how-it-works-section.tsx` — every act now reads in the same direction (left-to-right), keeping the page as a calm vertical scroll.

**Visuals:** Reuse the existing `AddTaskVisual` / `MatrixVisual` / `TodaysFocusVisual` components from `components/landing/how-it-works-section.tsx` — same content, same logic, only tonal adjustments to match the warmer palette (cream/`#FFFDF7` backgrounds in place of pure white, warm-tinted borders `rgba(180, 83, 9, 0.2)` in place of slate borders).

**Headline copy (tightened):**
- 01: `Empty your head.` — was "Get it off your mind"
- 02: `Friday sorts the noise.` — was "Let Friday sort the noise"
- 03: `Wake up to four things.` — was "Wake up knowing what to do"

**Body copy:** Keep close to existing copy but trim by ~20%. Each description should be one short paragraph.

Existing chapter visuals (`AddTaskVisual`, `MatrixVisual`, `TodaysFocusVisual`) are kept with minor tonal adjustments to match the warmer palette (cream backgrounds instead of pure white, warm-tinted borders).

### 4.5 Mid-page CTA (NEW)

**Layout:** Single centered row, padding `py-9 px-10`, background `#FFFDF7` with a thin top border (`1px solid rgba(180, 83, 9, 0.1)`).

**Content:**
- Italic display serif headline: `Want this for your tomorrow?` — size `text-2xl`, color `#0f172a`.
- Inline CTA: Same `Begin Friday →` button as the hero.
- Microcopy beside the button: `60-second setup, free forever` — sans, size 12px, slate-500.

This section is intentionally quiet — it's a soft check-in, not a hard sell.

### 4.6 Eisenhower quote (PROMOTED)

**Layout:** Full-width, padding `py-12 px-10`, centered text.

**Background:** Gradient `linear-gradient(180deg, #fb923c 0%, #fdba74 30%, #fed7aa 100%)` — peach at the top (continuing from the previous section's cool-down) warming as the eye moves. This is the visual "warmest" section of the page.

**Content:**
- Eyebrow: `— A NOTE FROM 1954 —` — italic, letter-spaced.
- Quote: `"What is important is seldom urgent, and what is urgent is seldom important."` — display serif italic, weight 400, size `text-2xl md:text-3xl`, color `#422006`, max-width `max-w-2xl`.
- Attribution: `DWIGHT D. EISENHOWER` — eyebrow style, color `#78350f`.

The existing `TrustSignalSection` component is repurposed here. The decorative oversized quotation mark is dropped (the `— A NOTE FROM 1954 —` framing replaces it).

### 4.7 FAQ (NEW)

**Layout:** Centered single-column, max-width `max-w-2xl`, padding `py-14 px-10`.

**Background:** `#FFFDF7` (cream — the page returns to its starting tone).

**Section header:**
- Eyebrow: `COMMON QUESTIONS`.
- Title: `Before you sign up.` — display serif, weight 600.

**Four Q&As**, each separated by a thin warm divider (`1px solid rgba(180, 83, 9, 0.15)`):

1. **Q:** *How is Friday different from Todoist or Things?*
   **A:** Other apps hold your list. Friday picks your top four. We don't add features — we add clarity. If you've ever opened Todoist and felt overwhelmed, that's the gap Friday fills.

2. **Q:** *What if I have more than 4 important tasks?*
   **A:** You probably don't. Friday's whole job is helping you accept that. The rest go in the backlog and surface on the day they belong on. This is the discipline.

3. **Q:** *Is it really free?*
   **A:** Yes. Free forever for personal use. No card, no upgrade screen, no team plan to upsell you on.

4. **Q:** *What about my data?*
   **A:** Stored encrypted on Supabase. We never sell, share, or use your tasks to train anything. No tracking pixels. No analytics on your task content.

Questions are display serif weight 600; answers are body sans, color `#475569`, size `text-sm md:text-base`.

The answers commit the product to certain promises (free forever, no AI training, etc.). Founder should confirm comfort with each answer before launch.

### 4.8 Final CTA (REVISED copy)

**Layout:** Same as the existing `final-cta-section.tsx` but with the hero's gradient and sun glow treatment.

**Background:** Gradient `linear-gradient(180deg, #FFFDF7 0%, #fef3c7 30%, #fcd34d 65%, #fb923c 100%)` (mirrors the hero — the page closes the way it opened). Sun glow from bottom-center.

**Content:**
- Headline: `It's Friday.` (display serif weight 600) + `Lighten the load.` (display serif italic weight 400, color `#78350f`).
- CTA: `Begin Friday →` (same slate button).
- Microcopy: `Free forever · No card · 60-second setup`.

### 4.9 Footer (unchanged)

Existing footer in `app/page.tsx` is kept as-is.

---

## 5. Copy summary (single-source-of-truth list)

This section consolidates all approved copy so writing-plans / implementation can lift it verbatim.

**Hero**
- Eyebrow: `A DAILY FOCUS APP`
- Headline: `Less today. / More done.` (italic on second line)
- Subhead: `The to-do list that picks your top four for you, every morning — using the same matrix Eisenhower built to run a continent.`
- Primary CTA: `Begin Friday →`
- Secondary CTA: `See how it works ↓`
- Microcopy: `Free forever · No card · 60-second setup`

**Trust strip**
- Pills: `No AI gimmicks` / `No bloat` / `No upsells` / `No tracking` / `Just clarity`
- Subline: `Hand-built solo — because every other to-do list got it wrong.`

**Three Acts**
- Eyebrow: `THREE ACTS`
- Title: `Friday is built around one daily ritual.`
- Act 01: `Empty your head.`
- Act 02: `Friday sorts the noise.`
- Act 03: `Wake up to four things.`
- (Body copy: lift from existing `how-it-works-section.tsx`, trimmed by ~20%.)

**Mid-page CTA**
- Headline: `Want this for your tomorrow?`
- CTA: `Begin Friday →`
- Microcopy: `60-second setup, free forever`

**Eisenhower quote**
- Eyebrow: `— A NOTE FROM 1954 —`
- Quote: `"What is important is seldom urgent, and what is urgent is seldom important."`
- Attribution: `DWIGHT D. EISENHOWER`

**FAQ**
- Eyebrow: `COMMON QUESTIONS`
- Title: `Before you sign up.`
- 4 Q&As (see §4.7 above).

**Final CTA**
- Headline: `It's Friday. / Lighten the load.` (italic on second line)
- CTA: `Begin Friday →`
- Microcopy: `Free forever · No card · 60-second setup`

---

## 6. Implementation plan (high level)

The redesign maps cleanly onto the existing component layout in `components/landing/`. New components are added; existing ones are revised.

### Files to modify

- `app/page.tsx` — Update section order, add new section imports.
- `components/landing/hero-section.tsx` — Rewrite for asymmetric split + product peek. Drop the looping animation.
- `components/landing/how-it-works-section.tsx` — Rename internally to "Three Acts," update headlines, adjust visual styling to warmer palette. Section ID changes from `how-it-works` to `three-acts`.
- `components/landing/trust-signal-section.tsx` — Update layout (drop oversized quote glyph, add eyebrow), restyle background as part of the sunrise gradient.
- `components/landing/final-cta-section.tsx` — Update headline copy, background gradient, add sun glow treatment.

### Files to add

- `components/landing/trust-strip-section.tsx` — Anti-feature pills row.
- `components/landing/mid-cta-section.tsx` — Single quiet CTA between Three Acts and the Eisenhower quote.
- `components/landing/faq-section.tsx` — Four Q&A entries.

### Files to keep as-is

- `components/landing/fade-in.tsx` — Existing animation utility, used as-is.
- The CTA button styling (`cta-hover` + Tailwind utilities in the existing hero).

### Page section order in `app/page.tsx`

```tsx
<HeroSection />
<TrustStripSection />        {/* NEW */}
<HowItWorksSection />          {/* renamed visually to "Three Acts" */}
<MidCtaSection />              {/* NEW */}
<TrustSignalSection />         {/* Eisenhower quote — moved later */}
<FaqSection />                 {/* NEW */}
<FinalCTASection />
```

The gradient divider between Hero and Three Acts (currently in `app/page.tsx`) is removed — the trust strip handles the transition.

### Out of scope

- Mobile-first refinements beyond standard responsive grid stacking. All sections collapse to single-column on `<md` breakpoints.
- Auth, dashboard, settings, and onboarding screens.
- Analytics/event tracking on CTAs (separate spec — `analytics-tracking` skill).
- A/B testing infrastructure.
- Internationalization.

---

## 7. Accessibility

- All headlines maintain WCAG AA contrast: `slate-900` on amber-100 = ~13:1, `amber-900` on amber-100 = ~7:1 (both pass). Sun-glow areas may push specific text below 4.5:1 — verify the subhead against the brightest gradient stop during implementation; if needed, darken the subhead text by one shade.
- Reduced-motion: All `animate-fade-up` and other entrance animations respect `prefers-reduced-motion`. The looping hero animation is removed entirely (which conveniently eliminates a reduced-motion concern).
- The product peek card in the hero is decorative; primary information is in the headline and subhead. The card has `aria-hidden="true"` and the four sample task names are not screen-reader content.
- Focus states on CTAs: keep existing focus ring utilities.

---

## 8. Risks and open questions

| Risk | Mitigation |
|---|---|
| Founder voice ("Hand-built solo...") may not feel right | Confirm with founder pre-implementation; alternatives in spec history. |
| FAQ answers commit product to specific promises (free forever, no AI training) | Founder reviews and confirms before merge. |
| Cinematic design is harder to iterate quickly than template SaaS | Acceptable — distinctiveness is the point. |
| Pre-launch trust strip feels thin without real metrics | Anti-feature framing carries it; replace with real metrics post-launch. |
| The "Eisenhower built to run a continent" subhead might be too marketing-y | Three alternatives listed in §4.2; founder picks final. |

---

## 9. Success criteria

The redesign succeeds when:

1. A cold visitor (e.g., from SEO) can identify the product category and core value prop within 5 seconds of landing.
2. A warm visitor (e.g., from Twitter) feels the page has personality and is worth sharing a screenshot of.
3. The page has at least three CTAs above the fold across desktop scroll: hero primary, hero secondary, and the mid-page CTA after Three Acts.
4. All copy is consistent with `docs/friday-messaging-positioning.md`.
5. The page passes axe/lighthouse accessibility checks at AA level.
6. Page reads as a coherent visual sunrise narrative when scrolled top-to-bottom on desktop.

---

## 10. Mockups

Visual references for this spec are saved in `.superpowers/brainstorm/14050-1777153021/content/`:

- `directions.html` — initial four directions explored
- `hybrids.html` — three B+D fusion directions
- `refined-fullpage.html` — first cinematic full-page concept (v1)
- `cro-eval.html` — CRO evaluation and recommendations
- `v2-fullpage.html` — **the approved direction (this spec)**

These are session artifacts and not committed to git.
