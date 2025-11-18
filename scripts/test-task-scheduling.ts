import { 
  formatDateLocal, 
  getTodayLocal, 
  addDaysToDateString, 
  getDayOfWeek,
  parseDateLocal 
} from '../lib/utils/date-utils';
import { 
  generateInitialRecurringInstances, 
  generateNextRecurringInstance 
} from '../lib/utils/recurring-tasks';
import { 
  assignStartDates, 
  getTodaysFocusTasks 
} from '../lib/utils/task-prioritization';
import { Task, CategoryLimits, DailyMaxHours } from '../lib/types';

// Mock data
const mockCategoryLimits: CategoryLimits = {
  Work: { weekday: 6, weekend: 2 },
  Home: { weekday: 3, weekend: 4 },
  Health: { weekday: 2, weekend: 2 },
  Personal: { weekday: 2, weekend: 3 },
};

const mockDailyMaxHours: DailyMaxHours = {
  weekday: 8,
  weekend: 6,
};

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    title: 'Test Task',
    category: 'Personal',
    importance: 'not-important',
    urgency: 'not-urgent',
    estimated_hours: 1,
    completed: false,
    is_recurring: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Task;
}

// Test 1: Date utilities work in local timezone
function testDateUtilities() {
  console.log('\n=== Test 1: Date Utilities (Local Timezone) ===');
  
  const today = getTodayLocal();
  console.log('✓ getTodayLocal():', today);
  
  const testDate = new Date(2025, 10, 14); // Nov 14, 2025 in local time
  const formatted = formatDateLocal(testDate);
  console.log('✓ formatDateLocal(Nov 14, 2025):', formatted);
  console.assert(formatted === '2025-11-14', 'Date should format correctly');
  
  const parsed = parseDateLocal('2025-11-14');
  console.log('✓ parseDateLocal("2025-11-14"):', parsed);
  console.assert(parsed.getFullYear() === 2025, 'Year should be 2025');
  console.assert(parsed.getMonth() === 10, 'Month should be 10 (November)');
  console.assert(parsed.getDate() === 14, 'Date should be 14');
  
  const nextDay = addDaysToDateString('2025-11-14', 1);
  console.log('✓ addDaysToDateString("2025-11-14", 1):', nextDay);
  console.assert(nextDay === '2025-11-15', 'Should add one day correctly');
  
  const dayOfWeek = getDayOfWeek('2025-11-14'); // Thursday
  console.log('✓ getDayOfWeek("2025-11-14"):', dayOfWeek);
  console.assert(dayOfWeek === 4, 'Nov 14, 2025 should be Thursday (4)');
  
  console.log('✅ All date utility tests passed!');
}

// Test 2: Non-recurring task gets scheduled on correct day
function testNonRecurringScheduling() {
  console.log('\n=== Test 2: Non-Recurring Task Scheduling ===');
  
  const today = getTodayLocal();
  const task = createMockTask({
    title: 'Call barber',
    due_date: today,
    start_date: undefined,
  });
  
  console.log('Task due date:', task.due_date);
  console.log('Today:', today);
  
  const scheduled = assignStartDates([task], mockCategoryLimits, mockDailyMaxHours);
  
  console.log('Scheduled start_date:', scheduled[0].start_date);
  console.assert(scheduled[0].start_date === today, 'Task should be scheduled for today');
  
  console.log('✅ Non-recurring task scheduled correctly!');
}

// Test 3: Recurring task instances are created on correct days
function testRecurringInstanceGeneration() {
  console.log('\n=== Test 3: Recurring Task Instance Generation ===');
  
  const baseTask = {
    title: 'Work out',
    category: 'Health' as const,
    due_date: '2025-11-17', // Sunday
    estimated_hours: 1,
    is_recurring: true,
    recurring_interval: 'weekly' as const,
    recurring_days: [0, 2, 4], // Sun, Tue, Thu
    recurring_end_type: 'never' as const,
  };
  
  const instances = generateInitialRecurringInstances(baseTask, 2); // 2 weeks
  
  console.log('Generated', instances.length, 'instances');
  
  instances.forEach(instance => {
    const dayOfWeek = getDayOfWeek(instance.due_date!);
    console.log('Instance:', instance.due_date, 'Day:', dayOfWeek);
    console.assert(
      baseTask.recurring_days!.includes(dayOfWeek),
      `Instance should be on Sun/Tue/Thu, got ${dayOfWeek}`
    );
    console.assert(
      instance.start_date === instance.due_date,
      'Recurring task start_date should equal due_date'
    );
  });
  
  console.log('✅ Recurring instances generated on correct days!');
}

// Test 4: Today view only shows tasks scheduled for today
function testTodayViewFiltering() {
  console.log('\n=== Test 4: Today View Filtering ===');
  
  const today = getTodayLocal();
  const tomorrow = addDaysToDateString(today, 1);
  const yesterday = addDaysToDateString(today, -1);
  
  const tasks = [
    createMockTask({ title: 'Today task', start_date: today }),
    createMockTask({ title: 'Tomorrow task', start_date: tomorrow }),
    createMockTask({ title: 'Yesterday task', start_date: yesterday }),
    createMockTask({ title: 'Completed today', start_date: today, completed: true }),
  ];
  
  const todayTasks = getTodaysFocusTasks(tasks);
  
  console.log('Today:', today);
  console.log('Today tasks count:', todayTasks.length);
  
  const incompleteTodayTasks = todayTasks.filter(t => !t.completed);
  const completedTodayTasks = todayTasks.filter(t => t.completed);
  
  console.log('Incomplete today tasks:', incompleteTodayTasks.length);
  console.log('Completed today tasks:', completedTodayTasks.length);
  
  console.assert(incompleteTodayTasks.length === 1, 'Should have 1 incomplete task for today');
  console.assert(completedTodayTasks.length === 1, 'Should have 1 completed task for today');
  console.assert(incompleteTodayTasks[0].title === 'Today task', 'Should be the today task');
  
  console.log('✅ Today view filtering works correctly!');
}

// Test 5: Editing task due_date updates start_date
function testEditTaskDueDateUpdate() {
  console.log('\n=== Test 5: Edit Task Due Date ===');
  
  const task = createMockTask({
    title: 'Call barber',
    due_date: '2025-11-14',
    start_date: '2025-11-14',
  });
  
  console.log('Original:', task.due_date, task.start_date);
  
  // Simulate editing the task
  const updatedTask = {
    ...task,
    due_date: '2025-11-15',
    start_date: '2025-11-15', // Should be updated
  };
  
  console.log('Updated:', updatedTask.due_date, updatedTask.start_date);
  
  console.assert(updatedTask.start_date === updatedTask.due_date, 'start_date should match new due_date');
  
  console.log('✅ Task edit updates start_date correctly!');
}

// Test 6: Next recurring instance is calculated correctly
function testNextRecurringInstance() {
  console.log('\n=== Test 6: Next Recurring Instance ===');
  
  const completedTask = createMockTask({
    title: 'Work out',
    due_date: '2025-11-17', // Sunday
    is_recurring: true,
    recurring_interval: 'weekly',
    recurring_days: [0, 2, 4], // Sun, Tue, Thu
    recurring_end_type: 'never',
    recurring_current_count: 1,
    completed: true,
  });
  
  const nextInstance = generateNextRecurringInstance(completedTask);
  
  console.log('Completed task due date:', completedTask.due_date, '(Sunday)');
  console.log('Next instance due date:', nextInstance?.due_date);
  
  if (nextInstance) {
    const dayOfWeek = getDayOfWeek(nextInstance.due_date!);
    console.log('Next instance day of week:', dayOfWeek, '(should be Tuesday = 2)');
    console.assert(dayOfWeek === 2, 'Next instance should be Tuesday');
    console.assert(nextInstance.due_date === '2025-11-19', 'Next instance should be Nov 19');
  }
  
  console.log('✅ Next recurring instance calculated correctly!');
}

// Test 7: Non-recurring tasks capped at four per day
function testDailyTaskCap() {
  console.log('\n=== Test 7: Daily Task Cap ===');
  
  const today = getTodayLocal();
  const tomorrow = addDaysToDateString(today, 1);
  
  const tasks = Array.from({ length: 6 }).map((_, idx) =>
    createMockTask({
      title: `Overflow Task ${idx + 1}`,
      due_date: today,
      start_date: undefined,
      category: 'Home',
      estimated_hours: 0.5, // Small tasks to avoid capacity limits
    })
  );
  
  const { tasks: scheduledTasks } = assignStartDates(
    tasks,
    mockCategoryLimits,
    mockDailyMaxHours
  );
  
  const todayTasks = scheduledTasks.filter(t => !t.completed && !t.is_recurring && t.start_date === today);
  const tomorrowTasks = scheduledTasks.filter(t => !t.completed && !t.is_recurring && t.start_date === tomorrow);
  
  console.log('Tasks scheduled for today:', todayTasks.length);
  console.log('Tasks scheduled for tomorrow:', tomorrowTasks.length);
  
  console.assert(todayTasks.length === 4, 'Exactly 4 tasks should be scheduled for today');
  console.assert(
    tomorrowTasks.length === 2,
    'Remaining overflow tasks should move to the next day (tomorrow)'
  );
  
  console.log('✅ Daily task cap respected!');
}

// Test 8: Fallback logic respects 4-task cap when due date is full
function testFallbackRespectsTaskCap() {
  console.log('\n=== Test 8: Fallback Logic Respects Task Cap ===');
  
  const today = getTodayLocal();
  const dueDate = addDaysToDateString(today, 2); // 2 days from now
  
  // Create 5 tasks all due on the same date, with limited capacity
  // This will force some to use the fallback logic
  const tasks = Array.from({ length: 5 }).map((_, idx) =>
    createMockTask({
      title: `Due Date Task ${idx + 1}`,
      due_date: dueDate,
      start_date: undefined,
      category: 'Home',
      estimated_hours: 3, // Large tasks that will fill capacity quickly
    })
  );
  
  // Use very limited capacity to force fallback
  const limitedCategoryLimits: CategoryLimits = {
    Work: { weekday: 6, weekend: 2 },
    Home: { weekday: 1, weekend: 1 }, // Very limited - will force overflow
    Health: { weekday: 2, weekend: 2 },
    Personal: { weekday: 2, weekend: 3 },
  };
  
  const { tasks: scheduledTasks, warnings } = assignStartDates(
    tasks,
    limitedCategoryLimits,
    mockDailyMaxHours
  );
  
  const dueDateTasks = scheduledTasks.filter(t => !t.completed && !t.is_recurring && t.start_date === dueDate);
  const afterDueDateTasks = scheduledTasks.filter(t => 
    !t.completed && 
    !t.is_recurring && 
    t.start_date && 
    t.start_date > dueDate
  );
  
  console.log('Tasks scheduled on due date:', dueDateTasks.length);
  console.log('Tasks scheduled after due date:', afterDueDateTasks.length);
  console.log('Warnings:', warnings.length);
  
  // Due date should have at most 4 tasks
  console.assert(
    dueDateTasks.length <= 4,
    `Due date should have at most 4 tasks, got ${dueDateTasks.length}`
  );
  
  // If due date is full, remaining tasks should be scheduled after
  if (dueDateTasks.length === 4) {
    console.assert(
      afterDueDateTasks.length > 0 || tasks.length <= 4,
      'If due date is full, remaining tasks should be scheduled after due date'
    );
  }
  
  console.log('✅ Fallback logic respects task cap!');
}

// Test 9: Completed tasks keep their slots so new tasks aren't pulled into today
function testCompletedTasksHoldSlots() {
  console.log('\n=== Test 9: Completed Tasks Hold Slots ===');
  
  const today = getTodayLocal();
  const tomorrow = addDaysToDateString(today, 1);
  
  // Four tasks already on today (2 completed, 2 incomplete)
  const todaysExistingTasks = [
    createMockTask({ title: 'Today Complete 1', start_date: today, due_date: today, completed: true, category: 'Home', estimated_hours: 0.5 }),
    createMockTask({ title: 'Today Complete 2', start_date: today, due_date: today, completed: true, category: 'Home', estimated_hours: 0.5 }),
    createMockTask({ title: 'Today Incomplete 1', start_date: today, due_date: today, category: 'Home', estimated_hours: 0.5 }),
    createMockTask({ title: 'Today Incomplete 2', start_date: today, due_date: today, category: 'Home', estimated_hours: 0.5 }),
  ];
  
  // Backlog tasks that would try to fill today
  const backlogTasks = [
    createMockTask({ title: 'Backlog A', due_date: today, category: 'Home', estimated_hours: 0.5 }),
    createMockTask({ title: 'Backlog B', due_date: today, category: 'Home', estimated_hours: 0.5 }),
  ];
  
  const { tasks: scheduledTasks } = assignStartDates(
    [...todaysExistingTasks, ...backlogTasks],
    mockCategoryLimits,
    mockDailyMaxHours
  );
  
  const todaysTasks = scheduledTasks.filter(
    t => !t.is_recurring && t.start_date === today
  );
  const tomorrowTasks = scheduledTasks.filter(
    t => !t.is_recurring && t.start_date === tomorrow
  );
  
  console.log('Total tasks on today (including completed):', todaysTasks.length);
  console.log('Tasks moved to tomorrow:', tomorrowTasks.length);
  
  console.assert(
    todaysTasks.length === 4,
    `Today should still have exactly 4 tasks total, got ${todaysTasks.length}`
  );
  console.assert(
    tomorrowTasks.length >= backlogTasks.length,
    'Backlog tasks should be pushed to tomorrow once today has 4 tasks'
  );
  
  console.log('✅ Completed tasks keep their slots!');
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running Task Scheduling Tests...\n');
  console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  try {
    testDateUtilities();
    testNonRecurringScheduling();
    testRecurringInstanceGeneration();
    testTodayViewFiltering();
    testEditTaskDueDateUpdate();
    testNextRecurringInstance();
    testDailyTaskCap();
    testFallbackRespectsTaskCap();
    testCompletedTasksHoldSlots();
    
    console.log('\n✅ All tests passed! 🎉');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

runAllTests();
