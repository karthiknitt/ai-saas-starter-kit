import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/app/api/models/route';

// Mock external dependencies
vi.mock('@/lib/auth');
vi.mock('@/db/drizzle');
vi.mock('@/lib/crypto');
vi.mock('@/lib/arcjet');
vi.mock('@/lib/subscription-features');
vi.mock('next/headers');

import { db } from '../../src/db/drizzle';
// Import after mocking to get the mocked versions
import { aj } from '../../src/lib/arcjet';
import { auth } from '../../src/lib/auth';
import { decrypt } from '../../src/lib/crypto';
import { getAllowedModels } from '../../src/lib/subscription-features';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockDecrypt = vi.mocked(decrypt);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAj = vi.mocked(aj) as any;
const mockGetAllowedModels = vi.mocked(getAllowedModels);

// Mock fetch globally
global.fetch = vi.fn();

describe('/api/models', () => {
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

  const mockOpenAIModels = {
    data: [
      {
        id: 'gpt-4',
        object: 'model',
        created: 1687882411,
        owned_by: 'openai',
      },
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
      },
      {
        id: 'gpt-4-turbo',
        object: 'model',
        created: 1712361441,
        owned_by: 'openai',
      },
      {
        id: 'whisper-1', // Non-GPT model, should be filtered out
        object: 'model',
        created: 1677532384,
        owned_by: 'openai',
      },
    ],
  };

  const mockOpenRouterModels = {
    data: [
      {
        id: 'openai/gpt-4',
        name: 'GPT-4',
        created: 1687882411,
        description: 'OpenAI GPT-4',
        context_length: 8192,
        pricing: {
          prompt: '0.00003',
          completion: '0.00006',
        },
      },
      {
        id: 'anthropic/claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        created: 1712361441,
        description: 'Anthropic Claude 3.5 Sonnet',
        context_length: 200000,
        pricing: {
          prompt: '0.000003',
          completion: '0.000015',
        },
      },
      {
        id: 'invalid/model', // Model with no pricing
        name: 'Invalid Model',
        created: 1677532384,
        pricing: {
          prompt: '0',
          completion: '0',
        },
      },
    ],
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

    mockAuth.api.getSession.mockResolvedValue(mockSession);

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    mockDecrypt.mockReturnValue('decrypted-api-key');

    mockGetAllowedModels.mockResolvedValue(['gpt-3.5-turbo', 'gpt-4']);

    // Mock fetch for external API calls
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIModels,
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Arcjet Protection', () => {
    it('should return 403 for denied requests', async () => {
      mockAj.protect.mockResolvedValue({
        isDenied: () => true,
        id: 'test-id',
        ttl: 60,
        results: [],
        ip: '127.0.0.1',
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });
  });

  describe('API Configuration', () => {
    it('should return 404 when user has no API configuration', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                ...mockUser,
                provider: null,
                apiKeys: null,
              },
            ]),
          }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('No API configuration found');
    });
  });

  describe('OpenAI Provider', () => {
    it('should fetch and filter OpenAI models correctly', async () => {
      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.models).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);

      // Should only include GPT models
      const modelIds = data.models.map((m: any) => m.id);
      expect(modelIds).toContain('gpt-4');
      expect(modelIds).toContain('gpt-3.5-turbo');
      expect(modelIds).not.toContain('whisper-1');
    });

    it('should filter models based on subscription plan', async () => {
      mockGetAllowedModels.mockResolvedValue(['gpt-3.5-turbo']); // Free plan

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      const unlockedModels = data.models.filter((m: any) => !m.locked);
      expect(unlockedModels.length).toBe(1);
      expect(unlockedModels[0].id).toBe('gpt-3.5-turbo');
    });

    it('should allow all models for unlimited subscription', async () => {
      mockGetAllowedModels.mockResolvedValue(['*']); // Startup plan

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      // All GPT models should be unlocked
      const lockedModels = data.models.filter((m: any) => m.locked);
      expect(lockedModels.length).toBe(0);
    });

    it('should return 500 when OpenAI API fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to fetch models');
    });
  });

  describe('OpenRouter Provider', () => {
    beforeEach(() => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                ...mockUser,
                provider: 'openrouter',
              },
            ]),
          }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Update allowed models to include OpenRouter models
      mockGetAllowedModels.mockResolvedValue(['gpt', 'claude']);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockOpenRouterModels,
      });
    });

    it('should fetch and filter OpenRouter models correctly', async () => {
      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.models).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);

      // Should filter out models with no pricing
      const modelIds = data.models.map((m: any) => m.id);
      expect(modelIds).toContain('openai/gpt-4');
      expect(modelIds).toContain('anthropic/claude-3-5-sonnet');
      expect(modelIds).not.toContain('invalid/model');
    });

    it('should include context length and description for OpenRouter models', async () => {
      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      const model = data.models.find(
        (m: any) => m.id === 'anthropic/claude-3-5-sonnet',
      );
      expect(model).toBeDefined();
      expect(model.contextLength).toBe(200000);
      expect(model.description).toBe('Anthropic Claude 3.5 Sonnet');
    });
  });

  describe('Invalid Provider', () => {
    it('should return 400 for unsupported provider', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                ...mockUser,
                provider: 'unsupported',
              },
            ]),
          }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid provider');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockAuth.api.getSession.mockRejectedValue(new Error('Unexpected error'));

      const request = new Request('http://localhost:3000/api/models');

      const response = await GET(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to fetch models');
    });
  });
});
