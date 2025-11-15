// Unit tests for recurring task functionality
import { generateNextRecurringInstance, generateInitialRecurringInstances } from '../lib/utils/recurring-tasks';
import { assignStartDates } from '../lib/utils/task-prioritization';
import { Task, CategoryLimits, DailyMaxHours } from '../lib/types';

// Test data
const mockCategoryLimits: CategoryLimits = {
  Work: { weekday: 8, weekend: 2 },
  Home: { weekday: 3, weekend: 4 },
  Health: { weekday: 2, weekend: 3 },
  Personal: { weekday: 2, weekend: 3 },
};

const mockDailyMaxHours: DailyMaxHours = {
  weekday: 10,
  weekend: 6,
};

function createMockTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    title: 'Test Task',
    description: null,
    importance: 'not-important',
    urgency: 'not-urgent',
    estimated_hours: 1,
    category: 'Personal',
    due_date: new Date().toISOString().split('T')[0],
    start_date: null,
    is_recurring: false,
    recurring_series_id: null,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
    recurring_current_count: 1,
    completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: null,
    is_mit: false,
    ...overrides,
  };
}

// Test 1: Weekly recurring task with multiple days generates correct instances
function testGenerateInitialInstances() {
  console.log('\n=== Test 1: Generate Initial Instances ===');
  
  const baseTask = {
    title: 'Work out',
    category: 'Health',
    estimated_hours: 1,
    importance: 'important' as const,
    urgency: 'not-urgent' as const,
    due_date: '2025-11-17', // Sunday
    is_recurring: true,
    recurring_interval: 'weekly' as const,
    recurring_days: [0, 2, 4], // Sun, Tue, Thu
    recurring_end_type: 'never' as const,
    recurring_series_id: crypto.randomUUID(),
    recurring_current_count: 1,
  };

  const instances = generateInitialRecurringInstances(baseTask, 2); // 2 weeks
  
  console.log(`Generated ${instances.length} instances`);
  instances.forEach((inst, idx) => {
    const date = new Date(inst.due_date!);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    console.log(`  Instance ${idx + 1}: ${inst.due_date} (${dayName})`);
  });

  // Should have 6 instances: 3 days per week * 2 weeks
  const expectedCount = 6;
  if (instances.length === expectedCount) {
    console.log(`✅ PASS: Generated ${expectedCount} instances`);
  } else {
    console.log(`❌ FAIL: Expected ${expectedCount}, got ${instances.length}`);
  }

  // Verify all instances are on correct days
  const allCorrectDays = instances.every(inst => {
    const date = new Date(inst.due_date!);
    const day = date.getDay();
    return [0, 2, 4].includes(day);
  });

  if (allCorrectDays) {
    console.log('✅ PASS: All instances on correct days (Sun, Tue, Thu)');
  } else {
    console.log('❌ FAIL: Some instances on incorrect days');
  }
}

// Test 2: Scheduling respects recurring days
function testSchedulingRespectsRecurringDays() {
  console.log('\n=== Test 2: Scheduling Respects Recurring Days ===');
  
  const recurringSeriesId = crypto.randomUUID();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create weekly recurring task scheduled for Mon/Wed/Fri only
  const tasks: Task[] = [
    createMockTask({
      title: 'Gym',
      category: 'Health',
      is_recurring: true,
      recurring_interval: 'weekly',
      recurring_days: [1, 3, 5], // Mon, Wed, Fri
      recurring_series_id: recurringSeriesId,
      due_date: today.toISOString().split('T')[0],
    }),
  ];

  const scheduled = assignStartDates(tasks, mockCategoryLimits, mockDailyMaxHours, 14);
  const scheduledTask = scheduled.find(t => t.title === 'Gym');

  if (scheduledTask?.start_date) {
    const startDate = new Date(scheduledTask.start_date);
    const dayOfWeek = startDate.getDay();
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    
    console.log(`Task scheduled for: ${scheduledTask.start_date} (${dayName})`);
    
    if ([1, 3, 5].includes(dayOfWeek)) {
      console.log('✅ PASS: Task scheduled on correct day (Mon/Wed/Fri)');
    } else {
      console.log('❌ FAIL: Task scheduled on incorrect day');
    }
  } else {
    console.log('❌ FAIL: Task was not scheduled');
  }
}

// Test 3: Next instance generation for weekly tasks
function testNextInstanceGeneration() {
  console.log('\n=== Test 3: Next Instance Generation ===');
  
  const completedTask = createMockTask({
    title: 'Work out',
    is_recurring: true,
    recurring_interval: 'weekly',
    recurring_days: [0, 2, 4], // Sun, Tue, Thu
    recurring_end_type: 'never',
    recurring_series_id: crypto.randomUUID(),
    due_date: '2025-11-17', // Sunday
    recurring_current_count: 1,
    completed: true,
  });

  const nextInstance = generateNextRecurringInstance(completedTask);

  if (nextInstance) {
    const nextDate = new Date(nextInstance.due_date!);
    const dayOfWeek = nextDate.getDay();
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    
    console.log(`Next instance due: ${nextInstance.due_date} (${dayName})`);
    console.log(`Current count: ${nextInstance.recurring_current_count}`);
    
    if (dayOfWeek === 2) { // Should be Tuesday
      console.log('✅ PASS: Next instance on correct day (Tuesday after Sunday)');
    } else {
      console.log('❌ FAIL: Next instance on incorrect day');
    }

    if (nextInstance.recurring_current_count === 2) {
      console.log('✅ PASS: Instance count incremented');
    } else {
      console.log('❌ FAIL: Instance count not incremented correctly');
    }
  } else {
    console.log('❌ FAIL: No next instance generated');
  }
}

// Test 4: Recurring task with end count
function testRecurringEndCount() {
  console.log('\n=== Test 4: Recurring End Count ===');
  
  const baseTask = {
    title: 'Limited task',
    category: 'Personal',
    estimated_hours: 1,
    importance: 'not-important' as const,
    urgency: 'not-urgent' as const,
    due_date: '2025-11-17',
    is_recurring: true,
    recurring_interval: 'weekly' as const,
    recurring_days: [0, 2, 4],
    recurring_end_type: 'after' as const,
    recurring_end_count: 5,
    recurring_series_id: crypto.randomUUID(),
    recurring_current_count: 1,
  };

  const instances = generateInitialRecurringInstances(baseTask, 4);
  
  console.log(`Generated ${instances.length} instances with end count of 5`);
  
  if (instances.length === 5) {
    console.log('✅ PASS: Correct number of instances generated');
  } else {
    console.log(`❌ FAIL: Expected 5 instances, got ${instances.length}`);
  }

  // Test that no more instances are generated after limit
  const lastTask = createMockTask({
    ...baseTask,
    recurring_current_count: 5,
    due_date: instances[instances.length - 1].due_date!,
  });

  const shouldBeNull = generateNextRecurringInstance(lastTask);
  
  if (shouldBeNull === null) {
    console.log('✅ PASS: No instance generated after reaching end count');
  } else {
    console.log('❌ FAIL: Instance generated after reaching end count');
  }
}

// Run all tests
console.log('🧪 Running Recurring Tasks Unit Tests...');
testGenerateInitialInstances();
testSchedulingRespectsRecurringDays();
testNextInstanceGeneration();
testRecurringEndCount();
console.log('\n✨ Tests complete!\n');
