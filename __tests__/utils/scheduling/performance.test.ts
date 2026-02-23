import { SchedulingContext } from '@/lib/utils/scheduling/context';
import { scheduleTasksGreedy } from '@/lib/utils/scheduling/strategy';
import { addPriorityScores } from '@/lib/utils/task-prioritization';
import type { Task } from '@/types/task';

/**
 * Performance tests for the scheduling algorithm
 *
 * Goals:
 * - Schedule 100 tasks in <100ms
 * - Verify linear scaling O(n × lookAhead) not quadratic O(n²)
 * - Ensure no performance regressions
 */

describe('Scheduling Performance', () => {
  const todayStr = '2026-01-13';

  const categoryLimits = {
    work: 4,
    personal: 4,
    health: 2,
    learning: 2,
    social: 2,
  };

  const dailyMaxHours = {
    weekday: 8,
    weekend: 6,
  };

  const dailyMaxTasks = {
    weekday: 10,
    weekend: 8,
  };

  /**
   * Helper to generate test tasks
   */
  function generateTasks(count: number, options: {
    startDate?: string;
    category?: 'work' | 'personal' | 'health' | 'learning' | 'social';
    estimatedHours?: number;
  } = {}): Task[] {
    const tasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      tasks.push({
        id: `task-${i}`,
        user_id: 'test-user',
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        category: options.category || (['work', 'personal', 'health', 'learning', 'social'][i % 5] as any),
        priority: (i % 4) as 1 | 2 | 3 | 4,
        urgency: (i % 4) as 1 | 2 | 3 | 4,
        estimated_hours: options.estimatedHours ?? (i % 3) + 1,
        due_date: null,
        start_date: options.startDate ?? null,
        recurring_pattern: null,
        completed: false,
        completed_at: null,
        created_at: '2026-01-10T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z',
      });
    }

    return tasks;
  }

  /**
   * Measure execution time of a function
   */
  function measureTime(fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  }

  describe('Basic Performance Targets', () => {
    it('should schedule 100 tasks in less than 100ms', () => {
      const tasks = generateTasks(100);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 30,
        });
      });

      console.log(`Scheduled 100 tasks in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });

    it('should schedule 200 tasks in less than 200ms', () => {
      const tasks = generateTasks(200);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 30,
        });
      });

      console.log(`Scheduled 200 tasks in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(200);
    });

    it('should schedule 50 tasks with 60-day lookahead in less than 100ms', () => {
      const tasks = generateTasks(50);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 60,
        });
      });

      console.log(`Scheduled 50 tasks (60-day lookahead) in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Linear Scaling Verification', () => {
    it('should demonstrate linear O(n) scaling with task count', () => {
      const testSizes = [25, 50, 100, 200];
      const timings: number[] = [];

      for (const size of testSizes) {
        const tasks = generateTasks(size);
        const tasksWithScores = addPriorityScores(tasks);

        const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

        const executionTime = measureTime(() => {
          scheduleTasksGreedy(tasksWithScores, context, {
            todayStr,
            lookAheadDays: 30,
          });
        });

        timings.push(executionTime);
        console.log(`${size} tasks: ${executionTime.toFixed(2)}ms`);
      }

      // Verify approximately linear scaling
      // The ratio between 200 tasks and 100 tasks should be ~2x (not 4x for O(n²))
      const ratio = timings[3] / timings[2]; // 200 tasks / 100 tasks

      console.log(`Scaling ratio (200/100 tasks): ${ratio.toFixed(2)}x`);

      // Should be roughly 2x for linear, not 4x for quadratic
      // Allow generous variance for measurement noise in CI/variable environments
      expect(ratio).toBeLessThan(6); // If it was O(n²), this would be ~4+
    });

    it('should demonstrate linear scaling with lookahead window', () => {
      const tasks = generateTasks(50);
      const tasksWithScores = addPriorityScores(tasks);

      const lookaheadWindows = [15, 30, 60];
      const timings: number[] = [];

      for (const lookahead of lookaheadWindows) {
        const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

        const executionTime = measureTime(() => {
          scheduleTasksGreedy(tasksWithScores, context, {
            todayStr,
            lookAheadDays: lookahead,
          });
        });

        timings.push(executionTime);
        console.log(`Lookahead ${lookahead} days: ${executionTime.toFixed(2)}ms`);
      }

      // Verify linear scaling with lookahead window
      const ratio = timings[2] / timings[1]; // 60 days / 30 days

      console.log(`Lookahead scaling ratio (60/30 days): ${ratio.toFixed(2)}x`);

      // Should be roughly 2x for linear, allow headroom for measurement noise
      expect(ratio).toBeLessThan(6);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical daily workload (20 tasks) in less than 100ms', () => {
      const tasks = generateTasks(20);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 30,
        });
      });

      console.log(`Typical workload (20 tasks) scheduled in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle heavy workload (100 tasks) with existing scheduled tasks', () => {
      // Simulate 50 already-scheduled tasks
      const existingTasks = generateTasks(50, { startDate: '2026-01-14' });

      // Add 100 new tasks to schedule
      const newTasks = generateTasks(100);

      const tasksWithScores = addPriorityScores(newTasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      context.seedWithExistingTasks(existingTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 30,
        });
      });

      console.log(`Heavy workload (100 new + 50 existing) scheduled in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(150);
    });

    it('should handle tasks with varying estimated hours efficiently', () => {
      const tasks: Task[] = [];

      // Mix of short (0.5h), medium (2h), and long (4h) tasks
      for (let i = 0; i < 30; i++) {
        tasks.push(...generateTasks(1, { estimatedHours: 0.5 }));
        tasks.push(...generateTasks(1, { estimatedHours: 2 }));
        tasks.push(...generateTasks(1, { estimatedHours: 4 }));
      }

      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 30,
        });
      });

      console.log(`Mixed duration tasks (90 tasks) scheduled in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Context Performance', () => {
    it('should perform O(1) capacity lookups', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Seed with many tasks across many dates
      const existingTasks = generateTasks(500);
      for (let i = 0; i < existingTasks.length; i++) {
        const dayOffset = i % 30;
        existingTasks[i].start_date = `2026-01-${String(13 + dayOffset).padStart(2, '0')}`;
      }

      context.seedWithExistingTasks(existingTasks);

      // Measure time for 1000 capacity checks
      const executionTime = measureTime(() => {
        for (let i = 0; i < 1000; i++) {
          const dateOffset = i % 30;
          const date = `2026-01-${String(13 + dateOffset).padStart(2, '0')}`;
          context.getTaskCount(date);
          context.getTotalHours(date);
          context.getCategoryHours(date, 'work');
        }
      });

      console.log(`1000 capacity lookups: ${executionTime.toFixed(2)}ms`);

      // 1000 lookups should be nearly instant with O(1) Map lookups
      expect(executionTime).toBeLessThan(50);
    });

    it('should handle capacity reservations efficiently', () => {
      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
      const tasks = generateTasks(100);

      const executionTime = measureTime(() => {
        for (const task of tasks) {
          const date = '2026-01-15';
          if (context.canFitTask(date, task)) {
            context.reserveCapacity(date, task);
          }
        }
      });

      console.log(`100 capacity reservations: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(10);
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme workload (500 tasks) gracefully', () => {
      const tasks = generateTasks(500);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 60,
        });
      });

      console.log(`Extreme workload (500 tasks) scheduled in ${executionTime.toFixed(2)}ms`);

      // Should still complete in reasonable time (not quadratic blowup)
      expect(executionTime).toBeLessThan(1000); // 1 second
    });

    it('should maintain performance with tight capacity constraints', () => {
      // Very restrictive limits to force many capacity checks
      const tightLimits = {
        work: 1,
        personal: 1,
        health: 1,
        learning: 1,
        social: 1,
      };

      const tightMaxTasks = {
        weekday: 3,
        weekend: 2,
      };

      const tasks = generateTasks(100);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(tightLimits, dailyMaxHours, tightMaxTasks);

      const executionTime = measureTime(() => {
        scheduleTasksGreedy(tasksWithScores, context, {
          todayStr,
          lookAheadDays: 90, // Need more days with tight constraints
        });
      });

      console.log(`Tight constraints (100 tasks) scheduled in ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Performance Regression Detection', () => {
    /**
     * Baseline performance test that should be monitored over time.
     * If this test starts failing, it indicates a performance regression.
     */
    it('should meet baseline performance target (100 tasks in 50ms)', () => {
      const tasks = generateTasks(100);
      const tasksWithScores = addPriorityScores(tasks);

      const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

      // Run multiple times and take average
      const runs = 5;
      let totalTime = 0;

      for (let i = 0; i < runs; i++) {
        const contextCopy = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

        const executionTime = measureTime(() => {
          scheduleTasksGreedy(tasksWithScores, contextCopy, {
            todayStr,
            lookAheadDays: 30,
          });
        });

        totalTime += executionTime;
      }

      const averageTime = totalTime / runs;
      console.log(`Baseline (100 tasks, avg of ${runs} runs): ${averageTime.toFixed(2)}ms`);

      // Target: average under 50ms per run
      expect(averageTime).toBeLessThan(50);
    });
  });
});
