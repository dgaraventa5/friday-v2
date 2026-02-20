import { POST } from '@/app/api/reminders/complete/route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('POST /api/reminders/complete', () => {
  const mockSupabase = {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    process.env.NODE_ENV = 'test';
  });

  function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
    return new Request('http://localhost:3000/api/reminders/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  }

  describe('Origin Validation', () => {
    it('should return 403 for cross-origin requests in production', async () => {
      process.env.NODE_ENV = 'production';
      const request = makeRequest(
        { action: 'complete', reminderId: 'r1', completionDate: '2026-02-19' },
        { origin: 'https://evil.com', host: 'friday.example.com' }
      );
      const response = await POST(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Invalid origin');
    });

    it('should allow same-origin requests (Origin matches Host)', async () => {
      process.env.NODE_ENV = 'production';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }, error: null,
      });
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'c1', reminder_id: 'r1', status: 'completed' },
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_count: 0 }, error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const request = makeRequest(
        { action: 'complete', reminderId: 'r1', completionDate: '2026-02-19' },
        { origin: 'https://friday.example.com', host: 'friday.example.com' }
      );
      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }, error: new Error('Not authenticated'),
      });
      const request = makeRequest({
        action: 'complete', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should return 400 when reminderId is missing', async () => {
      // Validation happens before auth, so no auth mock needed
      const request = makeRequest({ action: 'complete', completionDate: '2026-02-19' });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid action', async () => {
      // Invalid action falls through all if/else blocks after auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }, error: null,
      });
      const request = makeRequest({
        action: 'invalid', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Complete action', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }, error: null,
      });
    });

    it('should upsert completion and increment count', async () => {
      const upsertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'c1', reminder_id: 'r1', status: 'completed', completion_date: '2026-02-19' },
            error: null,
          }),
        }),
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_count: 2 }, error: null,
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reminder_completions') return { upsert: upsertMock };
        if (table === 'reminders') return { select: selectMock, update: updateMock };
        return {};
      });

      const request = makeRequest({
        action: 'complete', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('completed');
    });

    it('should return 500 when upsert fails', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, error: new Error('DB error'),
            }),
          }),
        }),
      });

      const request = makeRequest({
        action: 'complete', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Uncomplete action', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }, error: null,
      });
    });

    it('should require completionId', async () => {
      const request = makeRequest({
        action: 'uncomplete', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should delete completion and decrement count', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_count: 3 }, error: null,
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reminder_completions') return { delete: deleteMock };
        if (table === 'reminders') return { select: selectMock, update: updateMock };
        return {};
      });

      const request = makeRequest({
        action: 'uncomplete', reminderId: 'r1', completionDate: '2026-02-19', completionId: 'c1',
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
    });

    it('should not decrement below 0', async () => {
      const deleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_count: 0 }, error: null,
          }),
        }),
      });
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'reminder_completions') return { delete: deleteMock };
        if (table === 'reminders') return { select: selectMock, update: updateMock };
        return {};
      });

      const request = makeRequest({
        action: 'uncomplete', reminderId: 'r1', completionDate: '2026-02-19', completionId: 'c1',
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      // update should NOT have been called since count is 0
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe('Skip/Unskip actions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }, error: null,
      });
    });

    it('should upsert skip status', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'c1', status: 'skipped' }, error: null,
            }),
          }),
        }),
      });

      const request = makeRequest({
        action: 'skip', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect((await response.json()).data.status).toBe('skipped');
    });

    it('should require completionId for unskip', async () => {
      const request = makeRequest({
        action: 'unskip', reminderId: 'r1', completionDate: '2026-02-19',
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
