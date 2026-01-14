import { ProfileService } from '@/lib/services/profile-service';
import { Profile } from '@/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a properly chainable mock Supabase client
const createMockSupabaseClient = () => {
  const client = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  return client;
};

describe('ProfileService', () => {
  let service: ProfileService;
  let mockSupabase: any;

  const mockProfile: Profile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    current_streak: 5,
    longest_streak: 10,
    last_completion_date: '2025-01-15',
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    service = new ProfileService(mockSupabase as unknown as SupabaseClient);
  });

  describe('getProfile', () => {
    it('should successfully fetch a user profile', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });

      const result = await service.getProfile('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it('should handle profile not found', async () => {
      const mockError = { message: 'Profile not found' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.getProfile('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to fetch profile');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.single.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getProfile('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Unexpected error fetching profile');
    });
  });

  describe('updateProfile', () => {
    it('should successfully update a profile', async () => {
      const updates: Partial<Profile> = {
        full_name: 'Updated Name',
        daily_max_hours: {
          weekday: 8,
          weekend: 4,
        },
      };

      const updatedProfile = { ...mockProfile, ...updates };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateProfile('user-123', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.updateProfile('user-123', { full_name: 'New Name' });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to update profile');
    });

    it('should handle partial updates', async () => {
      const updates: Partial<Profile> = {
        onboarding_completed: true,
      };

      const updatedProfile = { ...mockProfile, ...updates };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateProfile('user-123', updates);

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });
  });

  describe('updateStreakFields', () => {
    it('should successfully update current streak', async () => {
      const updates = {
        current_streak: 6,
      };

      const updatedProfile = { ...mockProfile, current_streak: 6 };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        current_streak: 6,
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should successfully update longest streak', async () => {
      const updates = {
        longest_streak: 15,
      };

      const updatedProfile = { ...mockProfile, longest_streak: 15 };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        longest_streak: 15,
      });

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should successfully update last completion date', async () => {
      const updates = {
        last_completion_date: '2025-01-16',
      };

      const updatedProfile = { ...mockProfile, last_completion_date: '2025-01-16' };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        last_completion_date: '2025-01-16',
      });

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should successfully update multiple streak fields', async () => {
      const updates = {
        current_streak: 7,
        longest_streak: 12,
        last_completion_date: '2025-01-16',
      };

      const updatedProfile = { ...mockProfile, ...updates };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        current_streak: 7,
        longest_streak: 12,
        last_completion_date: '2025-01-16',
      });

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should handle setting last_completion_date to null (streak reset)', async () => {
      const updates = {
        current_streak: 0,
        last_completion_date: null,
      };

      const updatedProfile = { ...mockProfile, current_streak: 0, last_completion_date: null };

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        current_streak: 0,
        last_completion_date: null,
      });

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Streak update failed' };

      mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await service.updateStreakFields('user-123', { current_streak: 10 });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Failed to update streak fields');
    });

    it('should handle empty updates gracefully', async () => {
      const updatedProfile = mockProfile;

      mockSupabase.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await service.updateStreakFields('user-123', {});

      // Should update with empty object (no-op)
      expect(mockSupabase.update).toHaveBeenCalledWith({});

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });
  });
});
