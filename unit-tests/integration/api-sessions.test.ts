import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET } from '../../src/app/api/sessions/route';

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

describe('/api/sessions', () => {
  const currentSessionToken = 'current-token-123';
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockSession = {
    user: mockUser,
    session: {
      id: 'session-123',
      token: currentSessionToken,
    },
  };

  const mockSessions = [
    {
      id: 'session-123',
      token: currentSessionToken,
      userId: 'user-123',
      createdAt: new Date('2025-11-18T10:00:00Z'),
      expiresAt: new Date('2025-12-18T10:00:00Z'),
      ipAddress: '192.168.1.1',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      id: 'session-456',
      token: 'other-token-456',
      userId: 'user-123',
      createdAt: new Date('2025-11-17T10:00:00Z'),
      expiresAt: new Date('2025-12-17T10:00:00Z'),
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      id: 'session-789',
      token: 'old-token-789',
      userId: 'user-123',
      createdAt: new Date('2025-11-16T10:00:00Z'),
      expiresAt: new Date('2025-12-16T10:00:00Z'),
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockAuth.api.getSession.mockResolvedValue(mockSession);

    // Mock db.select for GET request
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockSessions),
        }),
      }),
    });

    // Mock db.query.session.findFirst for DELETE request
    mockDb.query = {
      session: {
        findFirst: vi.fn(),
      },
    };

    // Mock db.delete for DELETE request
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe('GET /api/sessions', () => {
    describe('Authentication', () => {
      it('should return 401 for unauthenticated requests', async () => {
        mockAuth.api.getSession.mockResolvedValue(null);

        const response = await GET();
        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Session Retrieval', () => {
      it('should return all user sessions', async () => {
        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.sessions).toBeDefined();
        expect(Array.isArray(data.sessions)).toBe(true);
        expect(data.sessions.length).toBe(3);
      });

      it('should mark current session correctly', async () => {
        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        const currentSession = data.sessions.find((s: any) => s.isCurrent);
        expect(currentSession).toBeDefined();
        expect(currentSession.token).toBe(currentSessionToken);
        expect(currentSession.id).toBe('session-123');
      });

      it('should include session details', async () => {
        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        const session = data.sessions[0];
        expect(session.id).toBeDefined();
        expect(session.token).toBeDefined();
        expect(session.createdAt).toBeDefined();
        expect(session.expiresAt).toBeDefined();
        expect(session.ipAddress).toBeDefined();
        expect(session.userAgent).toBeDefined();
      });

      it('should order sessions by creation date', async () => {
        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        // Sessions should be ordered (the mock already orders them)
        expect(data.sessions[0].id).toBe('session-123');
        expect(data.sessions[1].id).toBe('session-456');
        expect(data.sessions[2].id).toBe('session-789');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 for database errors', async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        });

        const response = await GET();
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.error).toBe('Failed to fetch sessions');
      });
    });
  });

  describe('DELETE /api/sessions', () => {
    const targetSession = mockSessions[1]; // session-456 (not current)

    beforeEach(() => {
      mockDb.query.session.findFirst.mockResolvedValue(targetSession);
    });

    describe('Authentication', () => {
      it('should return 401 for unauthenticated requests', async () => {
        mockAuth.api.getSession.mockResolvedValue(null);

        const request = new Request(
          'http://localhost:3000/api/sessions?id=session-456',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Session Deletion', () => {
      it('should delete a session successfully', async () => {
        const request = new Request(
          'http://localhost:3000/api/sessions?id=session-456',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify delete was called
        expect(mockDb.delete).toHaveBeenCalled();
      });

      it('should return 400 when session ID is missing', async () => {
        const request = new Request('http://localhost:3000/api/sessions', {
          method: 'DELETE',
        });

        const response = await DELETE(request);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Session ID required');
      });

      it('should return 404 when session does not exist', async () => {
        mockDb.query.session.findFirst.mockResolvedValue(null);

        const request = new Request(
          'http://localhost:3000/api/sessions?id=nonexistent',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Not found');
      });

      it('should return 404 when session belongs to different user', async () => {
        mockDb.query.session.findFirst.mockResolvedValue({
          ...targetSession,
          userId: 'other-user-456',
        });

        const request = new Request(
          'http://localhost:3000/api/sessions?id=session-456',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Not found');
      });

      it('should return 400 when trying to delete current session', async () => {
        mockDb.query.session.findFirst.mockResolvedValue({
          ...mockSessions[0],
          token: currentSessionToken,
        });

        const request = new Request(
          'http://localhost:3000/api/sessions?id=session-123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Cannot revoke current session');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 for database errors', async () => {
        mockDb.query.session.findFirst.mockRejectedValue(
          new Error('Database error'),
        );

        const request = new Request(
          'http://localhost:3000/api/sessions?id=session-456',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.error).toBe('Failed to delete session');
      });
    });
  });
});
