# Future Refactoring Phases for Friday v2

This document outlines remaining refactoring opportunities identified during the initial analysis but not yet implemented. These are **optional improvements** that can be tackled when needed.

---

## ✅ Completed Phases

- **Phase 1**: Service Layer (Days 1-4) ✅
- **Phase 2**: Dashboard Decomposition (Days 5-8) ✅
- **Phase 3**: Scheduling Optimization (Days 9-13) ✅

---

## 🔜 Future Phases

### Phase 4: Unify Duplicate Task Card Components

**Priority:** Medium
**Estimated Effort:** 2-3 days
**Impact:** Reduces maintenance burden, ensures UI consistency

#### Problem

Two nearly identical task card components exist with slight API differences:

- `components/today/task-card.tsx` (166 lines)
- `components/dashboard/task-card.tsx` (157 lines)

**Duplication:** ~60% shared code (same fields, similar handlers, identical UI structure)

#### Proposed Solution

**Day 1: Analysis & Design**
- Compare both components line-by-line
- Identify exact differences in props, handlers, and rendering
- Design unified API that supports both use cases
- Document migration strategy

**Day 2: Implementation**
- Create `components/task/task-card.tsx` as unified component
- Props interface that accepts:
  - `variant?: 'today' | 'schedule'` - Controls which features are shown
  - `onComplete`, `onEdit`, `onDelete` - Handlers
  - `showScheduleInfo?: boolean` - Show/hide scheduling details
  - `compact?: boolean` - Compact vs full view
- Implement component with conditional rendering based on variant

**Day 3: Migration & Testing**
- Migrate `components/today/today-view.tsx` to use new component
- Migrate `components/dashboard/schedule-view.tsx` to use new component
- Update tests for both views
- Remove old duplicate components

**Benefits:**
- Single source of truth for task card UI
- Easier to add new features (only one place to change)
- Consistent behavior across all views
- ~150 lines of code eliminated

**Files to Modify:**
- NEW: `components/task/task-card.tsx`
- UPDATE: `components/today/today-view.tsx`
- UPDATE: `components/dashboard/schedule-view.tsx`
- DELETE: `components/today/task-card.tsx`
- DELETE: `components/dashboard/task-card.tsx`
- NEW: `__tests__/components/task/task-card.test.tsx`

---

### Phase 5: Consolidate Form Duplication

**Priority:** Medium
**Estimated Effort:** 3-4 days
**Impact:** Reduces code duplication, simplifies form maintenance

#### Problem

Two forms share ~60% of their code:

- `components/task/add-task-form.tsx` (372 lines)
- `components/task/edit-task-dialog.tsx` (273 lines)

**Shared Elements:**
- Same form fields (title, description, category, priority, urgency, etc.)
- Same validation logic
- Same UI structure with ShadcN components
- Similar submit handlers (create vs update)

#### Proposed Solution

**Option A: Shared Form Component (Recommended)**

Create a base `TaskForm` component that both dialogs use:

```typescript
// components/task/task-form.tsx
export function TaskForm({
  mode: 'create' | 'edit',
  initialValues?: Partial<Task>,
  onSubmit: (values: TaskFormValues) => Promise<void>,
  onCancel: () => void
}) {
  // All form fields and validation logic
  // Shared between create and edit modes
}
```

Then:
- `AddTaskForm` wraps `TaskForm` with create-specific logic
- `EditTaskDialog` wraps `TaskForm` with edit-specific logic

**Day 1: Extract Form Component**
- Create `components/task/task-form.tsx`
- Move all form fields, validation, and UI to new component
- Create clear props interface

**Day 2: Create Custom Hook**
- Extract form state management to `hooks/use-task-form.ts`
- Handle validation, field updates, submission
- Reusable across create/edit modes

**Day 3: Refactor Add Task Form**
- Update `add-task-form.tsx` to use `TaskForm` component
- Pass create-specific submit handler
- Test task creation flow

**Day 4: Refactor Edit Task Dialog**
- Update `edit-task-dialog.tsx` to use `TaskForm` component
- Pass edit-specific submit handler
- Test task editing flow
- Integration tests for both forms

**Benefits:**
- ~200 lines of duplicated code eliminated
- Single place to add/modify form fields
- Consistent validation across create/edit
- Easier to add features like templates or bulk edit

**Files to Modify:**
- NEW: `components/task/task-form.tsx` (~200 lines)
- NEW: `hooks/use-task-form.ts` (~100 lines)
- UPDATE: `components/task/add-task-form.tsx` (372 → ~80 lines)
- UPDATE: `components/task/edit-task-dialog.tsx` (273 → ~80 lines)
- NEW: `__tests__/hooks/use-task-form.test.ts`

**Option B: Unified Dialog Component**

Create single `TaskFormDialog` that handles both modes:

```typescript
<TaskFormDialog
  mode="create" | "edit"
  task={editingTask}
  open={showDialog}
  onOpenChange={setShowDialog}
  onSuccess={() => { /* refresh */ }}
/>
```

**Trade-offs:**
- Option A: More flexible, clearer separation
- Option B: Simpler API, fewer components

**Recommendation:** Option A for better maintainability

---

### Phase 6: Clean Up Console Logging

**Priority:** Low
**Estimated Effort:** 1-2 days
**Impact:** Cleaner codebase, better debugging

#### Problem

**197 console.log/warn/error statements** across 17 files, many with prefixes like `[v0]`, `[v1]`, `[Scheduling]`

#### Analysis

**Files with most logging:**
- `lib/utils/task-prioritization.ts` - 50+ logs
- `lib/utils/scheduling/strategy.ts` - 20+ logs
- `components/dashboard/dashboard-client.tsx` - 15+ logs
- `lib/utils/streak-tracking.ts` - 10+ logs

**Types of logs:**
1. **Debug logs** (`[v0]`, `[v1]`) - Development artifacts
2. **Algorithm logs** (`[Scheduling]`) - Useful for debugging
3. **Error logs** - Should be kept
4. **Info logs** - May be useful in production

#### Proposed Solution

**Day 1: Create Logging Utility**

Create a proper logging system instead of raw console.log:

```typescript
// lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enabledModules = new Set(['scheduling', 'streak']); // Configurable

  debug(module: string, message: string, data?: any) {
    if (this.isDevelopment && this.enabledModules.has(module)) {
      console.log(`[${module}] ${message}`, data || '');
    }
  }

  info(module: string, message: string, data?: any) {
    console.log(`[${module}] ${message}`, data || '');
  }

  warn(module: string, message: string, data?: any) {
    console.warn(`[${module}] ${message}`, data || '');
  }

  error(module: string, message: string, error?: Error) {
    console.error(`[${module}] ${message}`, error || '');
  }
}

export const logger = new Logger();
```

**Day 2: Migrate Logging Calls**

Replace console.log calls with structured logging:

```typescript
// Before
console.log('[Scheduling] Task "Write docs": null → 2026-01-13');

// After
logger.debug('scheduling', 'Task scheduled', {
  title: task.title,
  from: task.start_date,
  to: scheduledDate
});
```

**Strategy:**
1. Keep **error logs** - Important for production debugging
2. Convert **debug logs** (`[v0]`, `[v1]`) to `logger.debug()` - Only shows in dev
3. Convert **algorithm logs** to `logger.debug()` with module flag
4. Remove **duplicate/redundant logs**
5. Keep **critical path logs** as `logger.info()`

**Benefits:**
- Cleaner production console (no debug spam)
- Configurable logging per module
- Easier to enable/disable logging categories
- Better structured log data
- Professional logging practices

**Files to Modify:**
- NEW: `lib/utils/logger.ts`
- UPDATE: `lib/utils/task-prioritization.ts` (remove ~30 logs)
- UPDATE: `lib/utils/scheduling/strategy.ts` (convert to logger)
- UPDATE: `components/dashboard/dashboard-client.tsx` (remove [v0] logs)
- UPDATE: ~15 other files with console.log statements

---

### Phase 7: Component Testing Coverage

**Priority:** Medium
**Estimated Effort:** 3-4 days
**Impact:** Improved reliability, easier refactoring

#### Problem

While we have excellent test coverage for:
- ✅ Services (unit tests)
- ✅ Hooks (unit tests)
- ✅ Scheduling algorithm (unit + performance tests)

We're missing tests for:
- ❌ UI Components (task cards, forms, dialogs)
- ❌ Dashboard composition (integration)
- ❌ Settings flow (E2E exists but could be expanded)

#### Proposed Solution

**Day 1-2: Component Unit Tests**

Add tests for key components:

```typescript
// __tests__/components/task/task-card.test.tsx
describe('TaskCard', () => {
  it('should display task information correctly');
  it('should call onComplete when checkbox clicked');
  it('should call onEdit when edit button clicked');
  it('should show due date indicator when overdue');
  // ... more tests
});

// __tests__/components/task/add-task-form.test.tsx
describe('AddTaskForm', () => {
  it('should validate required fields');
  it('should call onSubmit with correct values');
  it('should handle category selection');
  it('should handle recurring pattern setup');
  // ... more tests
});
```

**Day 3: Integration Tests**

Add more dashboard integration tests:

```typescript
// __tests__/integration/dashboard-full-flow.test.ts
describe('Dashboard Full Flow', () => {
  it('should create task and see it scheduled');
  it('should complete task and update streak');
  it('should edit task and see schedule update');
  it('should delete task and rebalance schedule');
});
```

**Day 4: Visual Regression Tests (Optional)**

Consider adding Storybook + Chromatic for visual testing:

```bash
npm install --save-dev @storybook/react
```

**Benefits:**
- Catch UI bugs before production
- Safe refactoring (tests catch regressions)
- Documentation through test examples
- Confidence in component behavior

**Files to Create:**
- NEW: `__tests__/components/task/task-card.test.tsx`
- NEW: `__tests__/components/task/add-task-form.test.tsx`
- NEW: `__tests__/components/task/edit-task-dialog.test.tsx`
- NEW: `__tests__/components/reminders/reminder-card.test.tsx`
- NEW: `__tests__/integration/dashboard-full-flow.test.ts`
- NEW: `__tests__/integration/task-lifecycle.test.ts`

---

### Phase 8: Type Safety Improvements

**Priority:** Low
**Estimated Effort:** 2-3 days
**Impact:** Better developer experience, fewer runtime errors

#### Problem

Some areas could benefit from stricter TypeScript:

1. **Database types** - Some Supabase queries use `any` or loose types
2. **Event handlers** - Some callbacks have `any` parameters
3. **Component props** - Some props are optional when they shouldn't be
4. **API responses** - Not all API routes have typed responses

#### Proposed Solution

**Day 1: Database Type Generation**

Use Supabase CLI to generate types from schema:

```bash
npx supabase gen types typescript --project-id <project-id> > lib/types/database.types.ts
```

Update service layer to use generated types:

```typescript
import type { Database } from '@/lib/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
```

**Day 2: API Route Type Safety**

Create typed API responses:

```typescript
// lib/types/api.types.ts
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// app/api/reschedule/route.ts
export async function POST(): Promise<NextResponse<ApiResponse<{
  rescheduled: number;
  warnings: string[];
}>>> {
  // ...
}
```

**Day 3: Component Props Strictness**

Add stricter prop types where needed:

```typescript
// Before
interface TaskCardProps {
  task?: Task;
  onComplete?: (id: string) => void;
}

// After
interface TaskCardProps {
  task: Task; // Required
  onComplete: (taskId: string) => Promise<void>; // Explicit return type
  variant: 'today' | 'schedule'; // No optional when always needed
}
```

**Benefits:**
- Catch type errors at compile time
- Better autocomplete in IDE
- Self-documenting code
- Easier refactoring

---

### Phase 9: Performance Optimizations (UI)

**Priority:** Low
**Estimated Effort:** 2-3 days
**Impact:** Better user experience on slower devices

#### Current State

The scheduling algorithm is now highly optimized (Phase 3 ✅), but there may be UI performance opportunities:

#### Potential Optimizations

**Day 1: React Optimization**

1. **Memoization Audit**
   - Add `React.memo()` to task cards (prevent re-renders)
   - Use `useMemo()` for expensive calculations
   - Use `useCallback()` for stable callbacks

```typescript
// Before
export function TaskCard({ task, onComplete }) {
  return <div>...</div>;
}

// After
export const TaskCard = React.memo(({ task, onComplete }) => {
  return <div>...</div>;
});
```

2. **Virtual Scrolling** (if needed)
   - If schedule view has 100+ tasks, add virtualization
   - Use `react-window` or `react-virtual`

**Day 2: Data Fetching**

1. **Parallel Loading**
   - Load tasks and reminders in parallel
   - Use `Promise.all()` in server components

2. **Caching Strategy**
   - Cache profile settings (rarely change)
   - Use SWR or React Query for client-side caching

**Day 3: Bundle Size**

1. **Code Splitting**
   - Lazy load dialogs (only load when opened)
   - Split settings page (loaded on-demand)

2. **Dependency Audit**
   - Check bundle size: `npm run build` and review
   - Remove unused dependencies
   - Consider lighter alternatives

**Benefits:**
- Faster page loads
- Smoother interactions
- Better mobile performance
- Lower bandwidth usage

---

### Phase 10: Accessibility (a11y) Improvements

**Priority:** Medium
**Estimated Effort:** 2-3 days
**Impact:** Makes app usable for everyone

#### Current State

Basic accessibility likely present from ShadcN components, but room for improvement.

#### Proposed Improvements

**Day 1: Keyboard Navigation**

1. **Task Card Navigation**
   - Tab through tasks in order
   - Space to select/complete task
   - Enter to open edit dialog
   - Delete key to delete (with confirmation)

2. **Dialog Navigation**
   - Escape to close
   - Tab trapping in modals
   - Focus management (return focus on close)

**Day 2: Screen Reader Support**

1. **Semantic HTML**
   - Use proper headings hierarchy
   - Add ARIA labels where needed
   - Ensure form labels are associated

2. **Live Regions**
   - Announce task completions
   - Announce schedule updates
   - Announce errors

```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {completionMessage && <p>{completionMessage}</p>}
</div>
```

**Day 3: Visual Improvements**

1. **Focus Indicators**
   - Visible focus states on all interactive elements
   - High contrast focus rings

2. **Color Contrast**
   - Ensure WCAG AA compliance (4.5:1 ratio)
   - Test with color blindness simulator

**Testing:**
- Use Lighthouse accessibility audit
- Test with screen reader (VoiceOver on Mac)
- Test keyboard-only navigation
- Run axe DevTools

**Benefits:**
- Usable by people with disabilities
- Better keyboard-only experience
- Legal compliance (if needed)
- Professional quality

---

## Implementation Priority Recommendation

Based on **impact vs effort**:

### High Priority (Do Next)
1. **Phase 4: Unify Task Cards** - Medium effort, reduces maintenance
2. **Phase 5: Consolidate Forms** - Medium effort, high code quality improvement

### Medium Priority (When Time Allows)
3. **Phase 7: Component Tests** - Increases confidence for future changes
4. **Phase 10: Accessibility** - Important for user experience
5. **Phase 8: Type Safety** - Better developer experience

### Low Priority (Nice to Have)
6. **Phase 6: Clean Up Logging** - Mostly cosmetic, but professional
7. **Phase 9: UI Performance** - Only if performance issues arise

---

## How to Approach Future Phases

### Before Starting Any Phase:

1. **Re-evaluate need** - Is this still a problem? Has it gotten worse?
2. **Check for changes** - Has the codebase evolved since this was written?
3. **Run tests** - Ensure starting from a green state (all tests passing)
4. **Create feature branch** - `git checkout -b refactor/phase-4-task-cards`
5. **Update plan if needed** - Adjust estimates based on current state

### During Implementation:

1. **Work incrementally** - Small commits, frequent tests
2. **Maintain test coverage** - Don't break existing tests
3. **Document as you go** - Update relevant docs
4. **Test manually** - Don't rely only on automated tests

### After Completion:

1. **Run full test suite** - Ensure nothing broke
2. **Update this document** - Mark phase as complete
3. **Create PR** - Get review if working with team
4. **Deploy and monitor** - Watch for any issues in production

---

## Metrics to Track

For each phase, track:

- **Lines of code changed** - Measure scope
- **Test coverage change** - Ensure tests added
- **Performance impact** - Before/after benchmarks (if applicable)
- **Time spent** - Compare to estimate

---

## Questions or Concerns?

Before starting a phase, consider:

- ❓ Is this the highest priority improvement right now?
- ❓ Are there any dependencies on other work?
- ❓ Do I have time to complete the phase fully?
- ❓ Will this break existing functionality?
- ❓ Do I understand the problem and solution?

---

## Summary

**Completed:** Phases 1-3 (Service Layer, Dashboard Decomposition, Scheduling)
**Remaining:** Phases 4-10 (Task Cards, Forms, Logging, Tests, Types, Performance, Accessibility)

**Total Estimated Effort:** 17-24 days for all remaining phases
**Highest Impact:** Phases 4, 5, 7, 10

**Current State:** ✅ Friday v2 is fully functional and production-ready
**Future State:** 🚀 Even more maintainable, tested, and polished

---

*Document created: 2026-01-13*
*Last updated: 2026-01-13*
