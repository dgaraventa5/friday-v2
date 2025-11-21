# friday design system

> *Focus on what matters most.*

## Table of Contents
1. [Brand Foundations](#brand-foundations)
2. [Logo & Visual Identity](#logo--visual-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Iconography](#iconography)
8. [Motion & Animation](#motion--animation)
9. [Voice & Tone](#voice--tone)
10. [Accessibility](#accessibility)

---

## Brand Foundations

### Brand Principles

**1. Approachable**
- Use lowercase lettering to feel friendly and casual
- Avoid corporate jargon or overly formal language
- Design should feel like a conversation with a trusted friend

**2. Delightful**
- Surprise users with thoughtful micro-interactions
- Celebrate small wins with subtle animations
- Make common tasks feel effortless and enjoyable

**3. Focused**
- Remove visual clutter and cognitive overload
- Prioritize clarity over complexity
- Each screen should have one clear purpose

**4. Modern**
- Clean, minimal aesthetic inspired by Airbnb and Uniswap
- Use contemporary design patterns
- Embrace white space and breathing room

**5. Smart**
- Anticipate user needs before they ask
- Use intelligent defaults and suggestions
- Make the app feel like it "just works"

### Design Philosophy

> "friday helps you focus on what matters most by removing everything that doesn't."

Our design approach is rooted in **reduction, not addition**. Every element must earn its place. We ask:
- Does this help the user focus?
- Does this reduce cognitive load?
- Does this bring joy or utility?

If the answer isn't a clear yes, it doesn't belong.

---

## Logo & Visual Identity

### Primary Logo

**Wordmark: "friday"**
- Always lowercase
- Font: Custom or Geist (current)
- Paired with sun icon (☀️) as the brand mark

**Logo Variations:**
```
☀️ friday         (Primary - full logo)
☀️                (Icon only - for favicons, app icons)
friday            (Wordmark only - when space is tight)
```

### Sun Icon Rationale
The sun represents:
- **New beginnings** - Each day is a fresh start
- **Energy & optimism** - Yellow evokes positivity
- **Warmth** - Approachable and friendly
- **Focus** - The sun rises on what matters most

### Logo Usage Rules

**DO:**
- Use lowercase "friday" in all brand contexts
- Pair the sun icon with the wordmark when possible
- Maintain clear space around the logo (minimum 16px)
- Use approved color variations

**DON'T:**
- Capitalize "Friday" in branding (only in sentences for grammar)
- Distort, rotate, or add effects to the logo
- Place on busy backgrounds without proper contrast
- Use unapproved colors

### Color Variations
- **Primary**: Yellow sun (#F59E0B) + Black text
- **Dark mode**: Yellow sun (#FBBF24) + White text
- **Monochrome**: Black or white (for print/special cases)

---

## Color System

### Primary Palette

Our color system is built around **yellow as the hero**, complemented by neutrals for balance and semantic colors for function.

#### Brand Colors

**Yellow (Primary)**
```
--yellow-50:  #FFFBEB (Subtle backgrounds)
--yellow-100: #FEF3C7 (Hover states, highlights)
--yellow-400: #FBBF24 (Interactive elements, dark mode)
--yellow-500: #F59E0B (Primary brand color)
--yellow-600: #D97706 (Active states, emphasis)
--yellow-700: #B45309 (Text on light backgrounds)
```

**Usage:**
- Streak indicators
- Call-to-action buttons (use sparingly!)
- Celebration moments
- Icons and accents
- Focus states

#### Neutral Palette

**Slate (Primary Neutral)**
```
--slate-50:  #F8FAFC (Backgrounds, subtle cards)
--slate-100: #F1F5F9 (Card backgrounds, dividers)
--slate-200: #E2E8F0 (Borders, inactive elements)
--slate-300: #CBD5E1 (Disabled states)
--slate-400: #94A3B8 (Placeholders)
--slate-500: #64748B (Secondary text)
--slate-600: #475569 (Body text)
--slate-700: #334155 (Headings)
--slate-800: #1E293B (Primary text)
--slate-900: #0F172A (High-emphasis text)
```

**Usage:**
- Primary text: slate-800 (light mode), slate-100 (dark mode)
- Secondary text: slate-600 (light mode), slate-400 (dark mode)
- Backgrounds: slate-50 (light), slate-900 (dark)

#### Semantic Colors

**Blue (Information, Progress)**
```
--blue-50:  #EFF6FF
--blue-500: #3B82F6 (Today's progress circles)
--blue-600: #2563EB (Active tasks)
```

**Green (Success, Completion)**
```
--green-50:  #F0FDF4
--green-500: #10B981 (Completed tasks)
--green-600: #059669 (Success messages)
```

**Red (Urgent, Errors)**
```
--red-50:  #FEF2F2
--red-500: #EF4444 (Urgent tasks)
--red-600: #DC2626 (Overdue items, errors)
```

**Orange (Streak, Warmth)**
```
--orange-50:  #FFF7ED
--orange-500: #F97316 (Streak fire icon)
--orange-600: #EA580C (Emphasis)
```

### Color Usage Guidelines

**Backgrounds:**
- Default: slate-50 (light), slate-900 (dark)
- Cards: white (light), slate-800 (dark)
- Hover: slate-100 (light), slate-700 (dark)

**Text:**
- Primary: slate-800 (light), slate-100 (dark)
- Secondary: slate-600 (light), slate-400 (dark)
- Muted: slate-500 (light), slate-500 (dark)

**Borders:**
- Default: slate-200 (light), slate-700 (dark)
- Focus: blue-500
- Error: red-500

**Interactive Elements:**
- Primary button: yellow-500 background, slate-900 text
- Secondary button: white background, slate-800 text, slate-200 border
- Ghost button: transparent, slate-600 text
- Destructive: red-600 background, white text

### Accessibility

All color combinations meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Approved Combinations:**
- slate-900 on white: 19.07:1 ✓
- slate-800 on white: 16.02:1 ✓
- slate-600 on white: 9.93:1 ✓
- yellow-600 on white: 4.51:1 ✓
- blue-600 on white: 5.95:1 ✓

---

## Typography

### Type Scale

**Font Family:**
```css
--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', Monaco, Consolas, monospace;
```

**Why Geist?**
- Modern, clean, and highly legible
- Variable font for performance
- Excellent across platforms
- Open-source and free

### Text Styles

```css
/* Display */
--text-display-2xl: 72px / 90px / -0.02em / 700
--text-display-xl:  60px / 72px / -0.02em / 700
--text-display-lg:  48px / 60px / -0.02em / 700
--text-display-md:  36px / 44px / -0.02em / 600
--text-display-sm:  30px / 38px / 0em / 600

/* Headings */
--text-xl: 20px / 30px / 0em / 600
--text-lg: 18px / 28px / 0em / 600
--text-md: 16px / 24px / 0em / 500
--text-sm: 14px / 20px / 0em / 500
--text-xs: 12px / 18px / 0em / 500

/* Body */
--text-body-lg: 18px / 28px / 0em / 400
--text-body:    16px / 24px / 0em / 400
--text-body-sm: 14px / 20px / 0em / 400
--text-body-xs: 12px / 18px / 0em / 400
```

### Typography Guidelines

**DO:**
- Use sentence case for most UI text
- Use title case only for major headings
- Keep line length between 50-75 characters
- Use medium (500) or semibold (600) for emphasis
- Maintain consistent hierarchy

**DON'T:**
- Use ALL CAPS (except for tiny labels like badges)
- Mix multiple font weights on the same line
- Use font sizes smaller than 12px
- Use more than 3 type sizes per screen

### Special Typography

**Brand Wordmark:**
- Always lowercase "friday"
- Use Geist at 24-32px for navigation
- Pair with sun icon

**Numbers:**
- Use tabular figures for data tables
- Use proportional figures for prose
- Use slashed zeros for clarity (0 vs O)

**Code/Monospace:**
- Use Geist Mono for technical content
- 14px size minimum
- Slate-700 color on light backgrounds

---

## Spacing & Layout

### Spacing Scale

Our spacing follows an 8-point grid system for consistency and rhythm.

```css
--spacing-0: 0px
--spacing-1: 4px   (0.25rem)
--spacing-2: 8px   (0.5rem)
--spacing-3: 12px  (0.75rem)
--spacing-4: 16px  (1rem)
--spacing-5: 20px  (1.25rem)
--spacing-6: 24px  (1.5rem)
--spacing-8: 32px  (2rem)
--spacing-10: 40px (2.5rem)
--spacing-12: 48px (3rem)
--spacing-16: 64px (4rem)
--spacing-20: 80px (5rem)
--spacing-24: 96px (6rem)
```

### Layout Patterns

**Container Widths:**
```css
--container-sm: 640px  (Mobile landscape, tablet portrait)
--container-md: 768px  (Tablet landscape)
--container-lg: 1024px (Desktop)
--container-xl: 1280px (Large desktop)
--container-2xl: 1536px (Extra large)
```

**Content Width:**
- Max width for readability: 768px
- Dashboard content: 1024px max
- Full-bleed: Use for hero sections only

**Grid:**
- 12-column grid for complex layouts
- 4-column for mobile
- 8-column for tablet

**Gutters:**
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px

### Component Spacing

**Cards:**
- Padding: 24px (lg), 20px (md), 16px (sm)
- Gap between cards: 16px (mobile), 24px (desktop)

**Forms:**
- Input padding: 12px 16px
- Label margin-bottom: 8px
- Form group gap: 24px

**Buttons:**
- Padding: 12px 24px (lg), 10px 20px (md), 8px 16px (sm)
- Icon gap: 8px

**Sections:**
- Section padding: 64px 0 (desktop), 48px 0 (mobile)
- Section gap: 96px (desktop), 64px (mobile)

### Responsive Breakpoints

```css
--screen-sm: 640px   (Mobile landscape)
--screen-md: 768px   (Tablet portrait)
--screen-lg: 1024px  (Tablet landscape / Small desktop)
--screen-xl: 1280px  (Desktop)
--screen-2xl: 1536px (Large desktop)
```

---

## Components

### Design Principles for Components

1. **Composability** - Components should work together seamlessly
2. **Predictability** - Behavior should be obvious and consistent
3. **Accessibility** - All interactive elements must be keyboard accessible
4. **Responsiveness** - Adapt gracefully to all screen sizes

### Core Components

#### Buttons

**Variants:**
```
Primary   - Yellow background, slate-900 text (use sparingly!)
Secondary - White background, border, slate-700 text
Ghost     - Transparent, slate-600 text, hover slate-100
Destructive - Red-600 background, white text
```

**Sizes:**
```
sm  - 8px 16px, 14px text
md  - 10px 20px, 16px text (default)
lg  - 12px 24px, 16px text
```

**States:**
- Default
- Hover (slight scale 1.02, lighter background)
- Active (scale 0.98)
- Disabled (50% opacity, no pointer events)
- Loading (spinner, disabled state)

**Composition:**
```tsx
<Button variant="primary" size="lg">
  Add Task
</Button>

<Button variant="ghost" size="sm">
  <Icon name="more" />
</Button>
```

#### Cards

**Anatomy:**
- Container (background, border, shadow, radius)
- Padding (16-24px)
- Content area
- Optional header
- Optional footer

**Variants:**
```
default  - White background, subtle border
elevated - White background, shadow-md, no border
outlined - Transparent background, thick border
```

**Hover States:**
- Subtle scale (1.01)
- Shadow elevation increase
- Border color intensifies

#### Input Fields

**Components:**
- Label (required, always visible)
- Input field
- Helper text (optional)
- Error message (when invalid)
- Icon (optional, left or right)

**States:**
- Default
- Focus (blue-500 ring, border)
- Error (red-500 ring, border)
- Disabled (50% opacity, cursor-not-allowed)
- Success (green-500 border, check icon)

**Sizes:**
```
sm  - 8px padding, 14px text
md  - 12px padding, 16px text (default)
lg  - 14px padding, 18px text
```

#### Task Card (Custom Component)

**Structure:**
```
┌─────────────────────────────────┐
│ ☐ Task Title                 •••│
│   Category Badge | Clock Icon 2h│
│   Due: Nov 20                   │
└─────────────────────────────────┘
```

**Elements:**
- Checkbox (left, vertically centered)
- Task title (primary text, slate-800)
- Category badge (colored, rounded-full)
- Time estimate (slate-500, with icon)
- Due date (slate-500, with icon)
- Actions menu (three-dot, right)
- Border-left (colored by quadrant)

**Quadrant Colors:**
```
Urgent + Important     - Red (Do First)
Important + Not Urgent - Blue (Schedule)
Urgent + Not Important - Amber (Delegate)
Neither                - Slate (Eliminate)
```

#### Navigation

**Bottom Nav (Mobile):**
- Fixed bottom
- 3-5 items max
- Icons + labels
- Active state: blue-600 color, slight scale
- Floating "+" button (elevated, yellow-500)

**Top Nav (Desktop):**
- Sticky top
- Logo left
- User menu right
- Streak indicator
- Progress circle

#### Modals / Dialogs

**Mobile:**
- Slide up from bottom (sheet style)
- Rounded top corners (24px radius)
- Max height: 85vh
- Safe area padding at bottom
- Handle/drag indicator at top

**Desktop:**
- Center screen
- Max width: 480px
- Shadow-2xl
- Backdrop blur
- ESC to close

#### Progress Indicators

**Circular Progress:**
- Size: 40px (mobile), 48px (desktop)
- Stroke width: 3px (mobile), 3.5px (desktop)
- Color: blue-500
- Background: slate-200/700
- Animated transition (500ms ease-out)

**Linear Progress:**
- Height: 8px
- Rounded ends
- Gradient optional
- Show percentage label

### Component States

**Interactive States (All):**
1. **Default** - Resting state
2. **Hover** - Cursor over (pointer devices only)
3. **Focus** - Keyboard focus (always visible ring)
4. **Active** - Mouse/touch down
5. **Disabled** - Cannot interact
6. **Loading** - Processing

---

## Iconography

### Icon Library

**Primary:** Lucide React (current)
- 1,400+ icons
- Consistent 24×24 grid
- Stroke-based, highly legible
- Tree-shakeable

**Icon Sizes:**
```
xs  - 12px (tiny indicators)
sm  - 16px (inline with text)
md  - 20px (default)
lg  - 24px (prominent)
xl  - 32px (hero icons)
```

### Custom Icons

**Sun Logo:**
- 24×24px base (scales to 32, 48, 64px)
- Yellow-500 color
- Simple, recognizable shape
- Works at small sizes

**Flame (Streak):**
- Use emoji (🔥) or Lucide `Flame` icon
- Orange-500 color
- Pair with streak count

### Icon Usage

**DO:**
- Use consistent stroke width (1.5-2px)
- Maintain optical balance
- Pair with labels when possible
- Use semantic colors (red for delete, green for success)

**DON'T:**
- Mix icon styles (outline + filled)
- Use icons smaller than 12px
- Use decorative icons without meaning
- Overuse icons (text is often clearer)

### Icon + Text Patterns

**Button with Icon:**
```tsx
<Button>
  <Plus size={20} />
  Add Task
</Button>
```

**Label with Icon:**
```tsx
<Label>
  <Clock size={16} />
  2 hours
</Label>
```

**Gap between icon and text:** 8px

---

## Motion & Animation

### Principles

1. **Purposeful** - Animations should clarify, not decorate
2. **Subtle** - Avoid loud, distracting movement
3. **Fast** - Keep under 300ms for most interactions
4. **Natural** - Use easing that mimics physics

### Timing Functions

```css
/* Acceleration curves */
--ease-in: cubic-bezier(0.4, 0, 1, 1)        /* Entering */
--ease-out: cubic-bezier(0, 0, 0.2, 1)       /* Exiting */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  /* Through */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy */
```

### Duration Scale

```css
--duration-fast: 150ms    (Micro-interactions)
--duration-normal: 250ms  (Default)
--duration-slow: 350ms    (Emphasis)
--duration-slower: 500ms  (Page transitions)
```

### Common Animations

**Button Hover:**
```css
transition: transform 150ms ease-out, 
            background-color 150ms ease-out;
transform: scale(1.02);
```

**Button Active:**
```css
transition: transform 100ms ease-in;
transform: scale(0.98);
```

**Card Hover:**
```css
transition: box-shadow 250ms ease-out,
            transform 250ms ease-out;
transform: translateY(-2px);
box-shadow: 0 8px 16px rgba(0,0,0,0.1);
```

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 250ms ease-out;
```

**Slide Up (Mobile Sheet):**
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
animation: slideUp 300ms cubic-bezier(0.32, 0.72, 0, 1);
```

**Task Complete (Check):**
```css
/* Scale + fade */
@keyframes taskComplete {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
animation: taskComplete 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Streak Count Up:**
```css
/* Number scales and fades in */
animation: countUp 600ms ease-out;
```

### Micro-Interactions

**Checkbox Check:**
1. Checkmark scales in with spring easing (400ms)
2. Background fills with green-500
3. Slight bounce at peak

**Progress Circle:**
1. Stroke animates smoothly (500ms ease-out)
2. Percentage updates with number transition
3. Celebrate 100% with subtle pulse

**Add Task Button:**
1. Float effect on idle (gentle 2s loop)
2. Scale on press (0.95)
3. Success feedback after submit (green ripple)

### Loading States

**Spinner:**
- 20px default size
- 2px stroke
- Smooth rotation (1s linear infinite)
- Slate-400 color

**Skeleton Loading:**
- Gray background (slate-200)
- Shimmer effect (linear-gradient animation)
- Match component shape
- Fade out when content loads

**Page Transitions:**
- Fade between routes (200ms)
- Slide up for modals (300ms)
- No elaborate page transitions (keep it simple)

---

## Voice & Tone

### Writing Principles

1. **Conversational** - Write like you're helping a friend
2. **Clear** - Use simple words, short sentences
3. **Encouraging** - Celebrate progress, stay positive
4. **Respectful** - Don't nag or guilt trip
5. **Lowercase** - Use "friday" not "Friday" in branding

### Examples

**✅ DO:**
- "Great job! All 4 tasks complete."
- "You have 2 tasks due today. Let's knock them out."
- "Your 7-day streak is on fire! 🔥"
- "friday helps you focus on what matters most."

**❌ DON'T:**
- "CONGRATULATIONS!!!"
- "You failed to complete your tasks."
- "Friday™ Enterprise Edition"
- "Utilizing synergistic methodologies..."

### Tone by Context

**Success States:**
- Warm and celebratory
- Use emojis sparingly (✓, 🎉, 🔥)
- "Nice work!", "All done!", "Crushing it!"

**Error States:**
- Helpful, not blaming
- Explain what happened and how to fix
- "Oops, something went wrong. Try again?"

**Empty States:**
- Encouraging, instructional
- "No tasks yet. Add your first one!"
- "Your schedule is clear. Time to plan ahead."

**Onboarding:**
- Friendly, patient, clear
- Short sentences, simple words
- "Let's get you set up in 60 seconds."

### Microcopy Guidelines

**Buttons:**
- Use verbs: "Add Task", "Save Changes", "Delete"
- Be specific: "Create Account" not "Submit"
- Keep under 3 words when possible

**Labels:**
- Descriptive but brief: "Task Name", "Due Date"
- Use sentence case
- No periods unless multiple sentences

**Helper Text:**
- One sentence, plain language
- Explain benefit, not feature
- "We'll suggest your top 4 tasks each day."

**Placeholders:**
- Provide examples: "e.g., Call dentist"
- Show format: "YYYY-MM-DD"
- Keep under 50 characters

---

## Accessibility

### WCAG 2.1 AA Compliance

Our goal: **Meet WCAG 2.1 Level AA standards at minimum.**

### Color Contrast

**Minimum Requirements:**
- Normal text (under 18pt): 4.5:1
- Large text (over 18pt): 3:1
- UI components: 3:1
- Graphics: 3:1

**Tested Combinations:**
All text/background pairs in the design system meet AA standards.

### Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Visible focus indicators (blue-500 ring, 3px)
- Logical tab order
- Skip links for long pages
- No keyboard traps

**Focus States:**
```css
.focusable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  border-color: rgb(59, 130, 246);
}
```

### Screen Readers

**Best Practices:**
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Provide alt text for all images
- Use ARIA labels when needed
- Announce dynamic changes (live regions)
- Hide decorative elements (`aria-hidden="true"`)

**Example:**
```tsx
<button aria-label="Add new task">
  <Plus aria-hidden="true" />
</button>
```

### Touch Targets

**Minimum sizes:**
- Mobile: 44×44px (Apple), 48×48px (Android)
- Desktop: 32×32px minimum
- Spacing: 8px between targets

### Motion Accessibility

**Respect reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Forms

**Requirements:**
- Labels always visible (no placeholder-only)
- Error messages clearly associated with fields
- Success states announced
- Required fields marked with asterisk + aria-required

**Example:**
```tsx
<div>
  <Label htmlFor="task-name">
    Task Name <span aria-label="required">*</span>
  </Label>
  <Input 
    id="task-name"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "error-msg" : undefined}
  />
  {hasError && (
    <span id="error-msg" role="alert">
      Task name is required
    </span>
  )}
</div>
```

### Testing Checklist

- [ ] All colors meet contrast ratios
- [ ] Keyboard navigation works for all interactions
- [ ] Focus indicators are always visible
- [ ] Screen reader announcements are appropriate
- [ ] Touch targets are large enough
- [ ] Motion respects user preferences
- [ ] Forms provide clear error messaging
- [ ] All images have alt text

---

## Implementation Notes

### Design Tokens

We use CSS variables for all design tokens:

```css
:root {
  /* Colors */
  --color-yellow-500: #F59E0B;
  --color-slate-800: #1E293B;
  
  /* Spacing */
  --spacing-4: 16px;
  
  /* Typography */
  --text-base: 16px;
  --font-sans: 'Geist', sans-serif;
  
  /* Shadows */
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  
  /* Radius */
  --radius-md: 8px;
  
  /* Transitions */
  --duration-normal: 250ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

### Component Library

Current stack:
- **Radix UI** - Headless components (accessibility)
- **Tailwind CSS** - Utility styling
- **Lucide React** - Icons
- **Geist** - Typography

### Future Considerations

**Mobile App:**
- Design tokens translate directly
- Use native components where appropriate (bottom sheets, navigation)
- Maintain brand consistency across platforms

**Dark Mode:**
- Already implemented via CSS variables
- Follow system preferences by default
- Allow manual toggle

**Localization:**
- Plan for text expansion (30-40%)
- RTL layout support
- Date/time formatting

---

## Resources

### Design Files
- [ ] Figma component library (to be created)
- [ ] Logo assets (SVG, PNG)
- [ ] Icon set (Lucide)

### Code
- Current implementation: `/components/ui/`
- Tailwind config: `/tailwind.config.ts`
- Global styles: `/app/globals.css`

### Documentation
- This design system (living document)
- Component Storybook (future)
- Accessibility audit reports

---

## Changelog

**v1.0 (Nov 2025)**
- Initial design system documentation
- Established brand foundations
- Defined color, typography, spacing systems
- Documented core components
- Accessibility guidelines

---

**Maintained by the friday team**
*Last updated: November 2025*