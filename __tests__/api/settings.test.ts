/**
 * Settings API Tests
 * 
 * These tests verify that the settings API endpoint correctly:
 * - Validates user authentication
 * - Validates input data
 * - Saves settings to the database
 * - Returns appropriate error messages
 */

import { POST } from '@/app/api/settings/route';
import { createClient } from '@/lib/supabase/server';
import type { CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Settings API', () => {
  const validCategoryLimits: CategoryLimits = {
    Work: { weekday: 10, weekend: 2 },
    Home: { weekday: 3, weekend: 4 },
    Health: { weekday: 3, weekend: 2 },
    Personal: { weekday: 2, weekend: 4 },
  };

  const validDailyMaxHours: DailyMaxHours = {
    weekday: 10,
    weekend: 6,
  };

  const validDailyMaxTasks: DailyMaxTasks = {
    weekday: 4,
    weekend: 4,
  };

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    test('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    test('should proceed for authenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Category Limits Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
    });

    test('should reject negative hours', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: {
            ...validCategoryLimits,
            Work: { weekday: -1, weekend: 2 },
          },
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('category limits');
    });

    test('should reject hours > 24', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: {
            ...validCategoryLimits,
            Work: { weekday: 25, weekend: 2 },
          },
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('should reject missing categories', async () => {
      const incompleteLimits = {
        Work: { weekday: 10, weekend: 2 },
        Home: { weekday: 3, weekend: 4 },
        // Missing Health and Personal
      };

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: incompleteLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('should reject invalid data types', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: {
            ...validCategoryLimits,
            Work: { weekday: '10', weekend: 2 }, // String instead of number
          },
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Daily Max Hours Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
    });

    test('should reject negative hours', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: { weekday: -1, weekend: 6 },
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('daily max hours');
    });

    test('should reject hours > 24', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: { weekday: 25, weekend: 6 },
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Daily Max Tasks Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
    });

    test('should reject tasks < 1', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: { weekday: 0, weekend: 4 },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('daily max tasks');
    });

    test('should reject tasks > 20', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: { weekday: 21, weekend: 4 },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test('should accept valid task limits', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: { weekday: 6, weekend: 3 },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
    });

    test('should call database update with correct data', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    test('should return success message on successful save', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          category_limits: validCategoryLimits,
          daily_max_hours: validDailyMaxHours,
          daily_max_tasks: validDailyMaxTasks,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toContain('successfully');
    });
  });
});

