import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/app/api/analytics/route';

// Mock external dependencies
vi.mock('@/lib/auth');
vi.mock('@/db/drizzle');
vi.mock('next/headers');

import { db } from '../../src/db/drizzle';
// Import after mocking to get the mocked versions
import { auth } from '../../src/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

describe('/api/analytics', () => {
  const mockAdminUser = {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockRegularUser = {
    id: 'user-123',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
  };

  const mockAdminSession = {
    user: mockAdminUser,
    session: { id: 'session-123', token: 'token-123' },
  };

  const mockUserSession = {
    user: mockRegularUser,
    session: { id: 'session-456', token: 'token-456' },
  };

  const mockUsageQuota = {
    userId: 'user-123',
    aiRequestsUsed: '25',
    aiRequestsLimit: '100',
    resetAt: new Date('2025-12-31'),
  };

  const mockUsageLogs = [
    {
      id: '1',
      userId: 'user-123',
      resourceType: 'ai_request',
      timestamp: new Date('2025-11-15T10:00:00Z'),
      metadata: JSON.stringify({
        model: 'gpt-4',
        responseTime: 1200,
        status: 'success',
      }),
    },
    {
      id: '2',
      userId: 'user-123',
      resourceType: 'ai_request',
      timestamp: new Date('2025-11-16T10:00:00Z'),
      metadata: JSON.stringify({
        model: 'gpt-3.5-turbo',
        responseTime: 800,
        status: 'success',
      }),
    },
    {
      id: '3',
      userId: 'user-123',
      resourceType: 'api_call',
      timestamp: new Date('2025-11-17T10:00:00Z'),
      metadata: JSON.stringify({
        model: 'gpt-4',
        responseTime: 1500,
        error: true,
        status: 'error',
      }),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockAuth.api.getSession.mockResolvedValue(mockUserSession);

    // Mock db.query.usageQuota.findFirst
    mockDb.query = {
      usageQuota: {
        findFirst: vi.fn().mockResolvedValue(mockUsageQuota),
      },
    };

    // Mock db.select for usage logs
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockUsageLogs),
        }),
      }),
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Period Parameter', () => {
    it('should default to 30d period when not specified', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.period).toBe('30d');
    });

    it('should accept 7d period', async () => {
      const request = new Request(
        'http://localhost:3000/api/analytics?period=7d',
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.period).toBe('7d');
    });

    it('should accept 90d period', async () => {
      const request = new Request(
        'http://localhost:3000/api/analytics?period=90d',
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.period).toBe('90d');
    });

    it('should accept all period', async () => {
      const request = new Request(
        'http://localhost:3000/api/analytics?period=all',
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.period).toBe('all');
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to query other users analytics', async () => {
      mockAuth.api.getSession.mockResolvedValue(mockAdminSession);

      const request = new Request(
        'http://localhost:3000/api/analytics?userId=user-456',
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.userId).toBe('user-456');
    });

    it('should return 403 when non-admin tries to query other users', async () => {
      const request = new Request(
        'http://localhost:3000/api/analytics?userId=other-user',
      );

      const response = await GET(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Analytics Data', () => {
    it('should return analytics with quota information', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.quota).toBeDefined();
      expect(data.quota.used).toBe('25');
      expect(data.quota.limit).toBe('100');
      expect(data.quota.resetAt).toBeDefined();
    });

    it('should return metrics with correct calculations', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalRequests).toBe(3);
      expect(data.metrics.errorCount).toBe(1);
      expect(data.metrics.errorRate).toBeCloseTo(33.33, 1);
      expect(data.metrics.avgResponseTime).toBeGreaterThan(0);
    });

    it('should return chart data grouped by resource type', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.charts).toBeDefined();
      expect(data.charts.byResourceType).toBeDefined();
      expect(data.charts.byResourceType.ai_request).toBe(2);
      expect(data.charts.byResourceType.api_call).toBe(1);
    });

    it('should return chart data grouped by day', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.charts).toBeDefined();
      expect(data.charts.byDay).toBeDefined();
      expect(Array.isArray(data.charts.byDay)).toBe(true);
      expect(data.charts.byDay.length).toBeGreaterThan(0);
      expect(data.charts.byDay[0]).toHaveProperty('date');
      expect(data.charts.byDay[0]).toHaveProperty('count');
    });

    it('should return model usage statistics', async () => {
      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.charts).toBeDefined();
      expect(data.charts.modelUsage).toBeDefined();
      expect(data.charts.modelUsage['gpt-4']).toBe(2);
      expect(data.charts.modelUsage['gpt-3.5-turbo']).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      mockDb.query.usageQuota.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to fetch analytics');
    });

    it('should handle missing quota gracefully', async () => {
      mockDb.query.usageQuota.findFirst.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.quota.used).toBe('0');
      expect(data.quota.limit).toBe('0');
    });

    it('should handle invalid metadata in usage logs', async () => {
      const logsWithInvalidMetadata = [
        {
          ...mockUsageLogs[0],
          metadata: 'invalid-json',
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(logsWithInvalidMetadata),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/analytics');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      // Should still return valid response, just skip invalid metadata
      expect(data.metrics.totalRequests).toBe(1);
    });
  });
});
