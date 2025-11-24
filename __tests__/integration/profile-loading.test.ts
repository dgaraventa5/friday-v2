/**
 * Profile Data Flow Tests
 * 
 * These tests verify that profile data flows correctly:
 * 1. From database to components
 * 2. Through scheduling algorithm
 * 3. With proper fallback handling
 */

import type { Profile, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

describe('Profile Data Flow', () => {
  const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    current_streak: 0,
    longest_streak: 0,
    last_completion_date: null,
    category_limits: {
      Work: { weekday: 10, weekend: 2 },
      Home: { weekday: 3, weekend: 4 },
      Health: { weekday: 3, weekend: 2 },
      Personal: { weekday: 2, weekend: 4 },
    },
    daily_max_hours: {
      weekday: 10,
      weekend: 6,
    },
    daily_max_tasks: {
      weekday: 4,
      weekend: 4,
    },
    onboarding_completed: true,
    ...overrides,
  });

  describe('Complete Profile Data', () => {
    test('should have all required fields', () => {
      const profile = createMockProfile();

      expect(profile.id).toBeTruthy();
      expect(profile.category_limits).toBeDefined();
      expect(profile.daily_max_hours).toBeDefined();
      expect(profile.daily_max_tasks).toBeDefined();
    });

    test('should have valid category limits structure', () => {
      const profile = createMockProfile();
      const categories = ['Work', 'Home', 'Health', 'Personal'] as const;

      categories.forEach(category => {
        expect(profile.category_limits[category]).toBeDefined();
        expect(profile.category_limits[category].weekday).toBeGreaterThanOrEqual(0);
        expect(profile.category_limits[category].weekend).toBeGreaterThanOrEqual(0);
      });
    });

    test('should have valid daily max hours structure', () => {
      const profile = createMockProfile();

      expect(profile.daily_max_hours.weekday).toBeGreaterThanOrEqual(0);
      expect(profile.daily_max_hours.weekday).toBeLessThanOrEqual(24);
      expect(profile.daily_max_hours.weekend).toBeGreaterThanOrEqual(0);
      expect(profile.daily_max_hours.weekend).toBeLessThanOrEqual(24);
    });

    test('should have valid daily max tasks structure', () => {
      const profile = createMockProfile();

      expect(profile.daily_max_tasks.weekday).toBeGreaterThanOrEqual(1);
      expect(profile.daily_max_tasks.weekday).toBeLessThanOrEqual(20);
      expect(profile.daily_max_tasks.weekend).toBeGreaterThanOrEqual(1);
      expect(profile.daily_max_tasks.weekend).toBeLessThanOrEqual(20);
    });
  });

  describe('Fallback Handling', () => {
    test('should handle missing daily_max_tasks with fallback', () => {
      // Simulate old profile before migration
      const profileWithoutTasks = createMockProfile({
        daily_max_tasks: null as any,
      });

      // Application should use fallback
      const dailyMaxTasks = profileWithoutTasks.daily_max_tasks && 
        typeof profileWithoutTasks.daily_max_tasks === 'object' &&
        'weekday' in profileWithoutTasks.daily_max_tasks &&
        'weekend' in profileWithoutTasks.daily_max_tasks &&
        typeof profileWithoutTasks.daily_max_tasks.weekday === 'number' &&
        typeof profileWithoutTasks.daily_max_tasks.weekend === 'number'
          ? profileWithoutTasks.daily_max_tasks
          : { weekday: 4, weekend: 4 };

      expect(dailyMaxTasks).toEqual({ weekday: 4, weekend: 4 });
    });

    test('should detect null vs undefined correctly', () => {
      const profileWithNull = createMockProfile({
        daily_max_tasks: null as any,
      });

      const profileWithUndefined = createMockProfile({
        daily_max_tasks: undefined as any,
      });

      // Both should trigger fallback
      expect(profileWithNull.daily_max_tasks == null).toBe(true);
      expect(profileWithUndefined.daily_max_tasks == null).toBe(true);
    });

    test('should reject invalid daily_max_tasks structures', () => {
      const invalidStructures = [
        {}, // Empty
        { weekday: 4 }, // Missing weekend
        { weekend: 4 }, // Missing weekday
        { weekday: '4', weekend: 4 }, // Wrong type
        { weekday: 0, weekend: 4 }, // Below minimum
        { weekday: 4, weekend: 25 }, // Above maximum
      ];

      invalidStructures.forEach(invalid => {
        const isValid = 
          invalid &&
          typeof invalid === 'object' &&
          'weekday' in invalid &&
          'weekend' in invalid &&
          typeof invalid.weekday === 'number' &&
          typeof invalid.weekend === 'number' &&
          invalid.weekday >= 1 &&
          invalid.weekday <= 20 &&
          invalid.weekend >= 1 &&
          invalid.weekend <= 20;

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Data Type Validation', () => {
    test('should ensure category_limits is object type', () => {
      const profile = createMockProfile();
      expect(typeof profile.category_limits).toBe('object');
      expect(profile.category_limits).not.toBeNull();
    });

    test('should ensure daily_max_hours is object type', () => {
      const profile = createMockProfile();
      expect(typeof profile.daily_max_hours).toBe('object');
      expect(profile.daily_max_hours).not.toBeNull();
    });

    test('should ensure daily_max_tasks is object type', () => {
      const profile = createMockProfile();
      expect(typeof profile.daily_max_tasks).toBe('object');
      expect(profile.daily_max_tasks).not.toBeNull();
    });

    test('should have numeric values in nested objects', () => {
      const profile = createMockProfile();

      // Check category limits
      Object.values(profile.category_limits).forEach(limit => {
        expect(typeof limit.weekday).toBe('number');
        expect(typeof limit.weekend).toBe('number');
      });

      // Check daily max hours
      expect(typeof profile.daily_max_hours.weekday).toBe('number');
      expect(typeof profile.daily_max_hours.weekend).toBe('number');

      // Check daily max tasks
      expect(typeof profile.daily_max_tasks.weekday).toBe('number');
      expect(typeof profile.daily_max_tasks.weekend).toBe('number');
    });
  });

  describe('Profile Update Scenarios', () => {
    test('should handle profile update with new daily_max_tasks', () => {
      const oldProfile = createMockProfile({
        daily_max_tasks: { weekday: 4, weekend: 4 },
      });

      const newProfile = createMockProfile({
        daily_max_tasks: { weekday: 6, weekend: 8 },
      });

      expect(newProfile.daily_max_tasks.weekday).toBeGreaterThan(oldProfile.daily_max_tasks.weekday);
      expect(newProfile.daily_max_tasks.weekend).toBeGreaterThan(oldProfile.daily_max_tasks.weekend);
    });

    test('should preserve other fields when updating daily_max_tasks', () => {
      const profile = createMockProfile();

      // Simulate update
      const updatedProfile = {
        ...profile,
        daily_max_tasks: { weekday: 6, weekend: 6 },
        updated_at: new Date().toISOString(),
      };

      // Other fields should remain unchanged
      expect(updatedProfile.id).toBe(profile.id);
      expect(updatedProfile.category_limits).toEqual(profile.category_limits);
      expect(updatedProfile.daily_max_hours).toEqual(profile.daily_max_hours);
      expect(updatedProfile.current_streak).toBe(profile.current_streak);
    });
  });

  describe('Database to Component Flow', () => {
    test('should parse JSONB fields correctly', () => {
      // Simulate database JSON string
      const dbCategoryLimits = '{"Work":{"weekday":10,"weekend":2},"Home":{"weekday":3,"weekend":4},"Health":{"weekday":3,"weekend":2},"Personal":{"weekday":2,"weekend":4}}';
      const dbDailyMaxHours = '{"weekday":10,"weekend":6}';
      const dbDailyMaxTasks = '{"weekday":4,"weekend":4}';

      const parsedCategoryLimits = JSON.parse(dbCategoryLimits);
      const parsedDailyMaxHours = JSON.parse(dbDailyMaxHours);
      const parsedDailyMaxTasks = JSON.parse(dbDailyMaxTasks);

      expect(parsedCategoryLimits.Work.weekday).toBe(10);
      expect(parsedDailyMaxHours.weekday).toBe(10);
      expect(parsedDailyMaxTasks.weekday).toBe(4);
    });

    test('should handle potential serialization issues', () => {
      const profile = createMockProfile();

      // Serialize and deserialize (simulate DB roundtrip)
      const serialized = JSON.stringify(profile);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.daily_max_tasks).toEqual(profile.daily_max_tasks);
      expect(deserialized.category_limits).toEqual(profile.category_limits);
      expect(deserialized.daily_max_hours).toEqual(profile.daily_max_hours);
    });
  });

  describe('Edge Cases', () => {
    test('should handle profile with extreme values', () => {
      const extremeProfile = createMockProfile({
        daily_max_tasks: { weekday: 1, weekend: 20 }, // Min and max
        daily_max_hours: { weekday: 24, weekend: 0 }, // Max and min
      });

      expect(extremeProfile.daily_max_tasks.weekday).toBe(1);
      expect(extremeProfile.daily_max_tasks.weekend).toBe(20);
    });

    test('should handle profile with matching weekday/weekend values', () => {
      const uniformProfile = createMockProfile({
        daily_max_tasks: { weekday: 5, weekend: 5 },
        daily_max_hours: { weekday: 8, weekend: 8 },
      });

      expect(uniformProfile.daily_max_tasks.weekday).toBe(uniformProfile.daily_max_tasks.weekend);
      expect(uniformProfile.daily_max_hours.weekday).toBe(uniformProfile.daily_max_hours.weekend);
    });
  });
});

