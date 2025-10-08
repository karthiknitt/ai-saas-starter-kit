import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { POST } from '../../src/app/api/chat/route';

// Mock external dependencies
vi.mock('@/lib/auth');
vi.mock('@/db/drizzle');
vi.mock('@/lib/crypto');
vi.mock('@/lib/arcjet');
vi.mock('@/lib/logger');
vi.mock('ai');
vi.mock('@ai-sdk/openai');
vi.mock('@openrouter/ai-sdk-provider');
vi.mock('next/headers');

// Import after mocking to get the mocked versions
import { auth } from '../../src/lib/auth';
import { db } from '../../src/db/drizzle';
import { decrypt } from '../../src/lib/crypto';
import { aj } from '../../src/lib/arcjet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockDecrypt = vi.mocked(decrypt);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAj = vi.mocked(aj) as any;

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => new Response('stream')),
  })),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: vi.fn(() => vi.fn()),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

describe('/api/chat', () => {
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

  let limitMock: Mock<() => Promise<typeof mockUser[]>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockAj.protect.mockResolvedValue({
      isDenied: () => false,
      isAllowed: () => true,
      id: 'test-id',
      ttl: 60,
      results: [],
      ip: '127.0.0.1'
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockAuth.api.getSession.mockResolvedValue(mockSession as { user: { id: string }; session: { id: string } });
    // Create a mockable limit function
    limitMock = vi.fn().mockResolvedValue([mockUser]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: limitMock
        })
      })
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    mockDecrypt.mockReturnValue('decrypted-api-key');
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent user', async () => {
      limitMock.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('API Key Validation', () => {
    it('should return 400 for missing API keys', async () => {
      limitMock.mockResolvedValue([{
        ...mockUser,
        apiKeys: null,
        provider: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }] as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('API key not configured');
    });

    it('should return 500 for API key decryption failure', async () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to decrypt API key');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 for invalid message format', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              // Missing content and text
            },
          ],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request format');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for too many messages', async () => {
      const messages = Array(101).fill({ role: 'user', content: 'Hello' });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request format');
    });
  });

  describe('Provider Handling', () => {
    it('should handle OpenAI provider correctly', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle OpenRouter provider correctly', async () => {
      limitMock.mockResolvedValue([{
        ...mockUser,
        provider: 'openrouter',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }] as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should return 400 for unsupported provider', async () => {
      limitMock.mockResolvedValue([{
        ...mockUser,
        provider: 'unsupported',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }] as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Unsupported provider');
    });
  });

  describe('Model Selection', () => {
    it('should use model from request body', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should fallback to default model when none specified', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Arcjet Protection', () => {
    it('should return 403 for denied requests', async () => {
      mockAj.protect.mockResolvedValue({ isDenied: () => true, id: 'test-id', ttl: 60, results: [], ip: '127.0.0.1' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockAuth.api.getSession.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('An error occurred while processing your request');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Successful Requests', () => {
    it('should return 200 for valid chat requests', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle messages with text field instead of content', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', text: 'Hello' },
            { role: 'assistant', text: 'Hi there!' },
          ],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });
});