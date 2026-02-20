import { verifyOrigin } from '@/lib/utils/security';

// Helper to create a Request with specific headers
function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers,
  });
}

describe('verifyOrigin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('requests without Origin or Referer', () => {
    it('should allow requests with no Origin or Referer headers', () => {
      const request = makeRequest({});
      const result = verifyOrigin(request);
      expect(result).toBeNull();
    });
  });

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should allow localhost origin on any port', () => {
      const result = verifyOrigin(makeRequest({ origin: 'http://localhost:3001' }));
      expect(result).toBeNull();
    });

    it('should allow 127.0.0.1 origin on any port', () => {
      const result = verifyOrigin(makeRequest({ origin: 'http://127.0.0.1:3000' }));
      expect(result).toBeNull();
    });

    it('should allow localhost referer when no origin', () => {
      const result = verifyOrigin(makeRequest({ referer: 'http://localhost:3000/dashboard' }));
      expect(result).toBeNull();
    });
  });

  describe('production mode with Host-header matching', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Clear env vars so we test host-based matching
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL_BRANCH_URL;
    });

    it('should allow request when Origin matches Host header', () => {
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday.example.com',
        host: 'friday.example.com',
      }));
      expect(result).toBeNull();
    });

    it('should allow request when Origin matches X-Forwarded-Host', () => {
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday.example.com',
        'x-forwarded-host': 'friday.example.com',
      }));
      expect(result).toBeNull();
    });

    it('should reject request when Origin does not match Host', () => {
      const result = verifyOrigin(makeRequest({
        origin: 'https://evil.com',
        host: 'friday.example.com',
      }));
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });
  });

  describe('production mode with env var allowlist', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should allow origin matching NEXT_PUBLIC_SITE_URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://friday.example.com';
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday.example.com',
      }));
      expect(result).toBeNull();
    });

    it('should allow origin matching VERCEL_URL', () => {
      process.env.VERCEL_URL = 'friday-v2.vercel.app';
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday-v2.vercel.app',
      }));
      expect(result).toBeNull();
    });

    it('should reject mismatched origin with 403', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://friday.example.com';
      const result = verifyOrigin(makeRequest({
        origin: 'https://evil.com',
      }));
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should handle NEXT_PUBLIC_SITE_URL without protocol', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'friday.example.com';
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday.example.com',
      }));
      expect(result).toBeNull();
    });

    it('should handle NEXT_PUBLIC_SITE_URL with trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://friday.example.com/';
      const result = verifyOrigin(makeRequest({
        origin: 'https://friday.example.com',
      }));
      expect(result).toBeNull();
    });

    it('should validate referer origin when Origin header is absent', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://friday.example.com';
      const result = verifyOrigin(makeRequest({
        referer: 'https://friday.example.com/dashboard',
      }));
      expect(result).toBeNull();
    });

    it('should reject invalid referer origin', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://friday.example.com';
      const result = verifyOrigin(makeRequest({
        referer: 'https://evil.com/page',
      }));
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });
  });
});
