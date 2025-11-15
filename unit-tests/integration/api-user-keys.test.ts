import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/app/api/user/api-keys/route';

// Mock external dependencies
vi.mock('@/lib/auth');
vi.mock('@/db/drizzle');
vi.mock('@/lib/crypto');
vi.mock('@/lib/arcjet');
vi.mock('@/lib/logger');

import { db } from '../../src/db/drizzle';
import { aj } from '../../src/lib/arcjet';
// Import after mocking
import { auth } from '../../src/lib/auth';
import { decrypt, encrypt } from '../../src/lib/crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockEncrypt = vi.mocked(encrypt);
const mockDecrypt = vi.mocked(decrypt);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAj = vi.mocked(aj) as any;

describe('/api/user/api-keys', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    image: null,
    apiKeys: 'encrypted-api-key',
    provider: 'openai',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    user: { id: 'user-123' },
    session: { id: 'session-123' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockAj.protect.mockResolvedValue({
      isDenied: () => false,
      isAllowed: () => true,
      id: 'test-id',
      ttl: 60,
      results: [],
      ip: '127.0.0.1',
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    mockAuth.api.getSession.mockResolvedValue(
      mockSession as { user: { id: string }; session: { id: string } },
    );

    // Mock database query chain
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockUser]),
    };
    mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    mockDecrypt.mockReturnValue('decrypted-api-key');
  });

  describe('GET /api/user/api-keys', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/user/api-keys');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent user', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/user/api-keys');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });

    it('should return provider and null apiKey when decryption fails', async () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const request = new Request('http://localhost:3000/api/user/api-keys');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.provider).toBe('openai');
      expect(data.apiKey).toBeNull();
    });

    it('should return provider and decrypted apiKey on success', async () => {
      const request = new Request('http://localhost:3000/api/user/api-keys');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.provider).toBe('openai');
      expect(data.apiKey).toBe('decrypted-api-key');
    });

    it('should return 403 for denied Arcjet requests', async () => {
      mockAj.protect.mockResolvedValue({
        isDenied: () => true,
        isAllowed: () => false,
        id: 'test-id',
        ttl: 60,
        results: [],
        ip: '127.0.0.1',
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/user/api-keys');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });
  });

  describe('POST /api/user/api-keys', () => {
    beforeEach(() => {
      // Mock database update chain
      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      };
      mockDb.update.mockReturnValue(mockUpdateQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ provider: 'openai', apiKey: 'test-key' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should clear API keys when empty values are provided', async () => {
      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ provider: '', apiKey: '' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify the update was called with null values
      expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
    });

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ provider: 'openai' }), // Missing apiKey
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid provider', async () => {
      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'invalid-provider',
          apiKey: 'test-key-12345678901234567890',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe(
        'Invalid provider. Must be "openai" or "openrouter"',
      );
    });

    it('should return 400 for invalid API key format', async () => {
      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'openai',
          apiKey: 'short', // Too short
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid API key format');
    });

    it('should successfully update API keys for valid input', async () => {
      mockEncrypt.mockReturnValue('encrypted-key');

      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'openai',
          apiKey: 'test-key-12345678901234567890',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify encryption was called
      expect(mockEncrypt).toHaveBeenCalledWith('test-key-12345678901234567890');
    });

    it('should return 403 for denied Arcjet requests', async () => {
      mockAj.protect.mockResolvedValue({
        isDenied: () => true,
        isAllowed: () => false,
        id: 'test-id',
        ttl: 60,
        results: [],
        ip: '127.0.0.1',
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ provider: 'openai', apiKey: 'test-key' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });

    it('should handle and log unexpected errors', async () => {
      mockAuth.api.getSession.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ provider: 'openai', apiKey: 'test-key' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('An error occurred while updating API keys');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
