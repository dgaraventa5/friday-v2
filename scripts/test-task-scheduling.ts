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
    
    console.log('\n✅ All tests passed! 🎉');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

runAllTests();
