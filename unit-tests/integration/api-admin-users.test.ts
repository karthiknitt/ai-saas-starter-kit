import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/auth');
vi.mock('@/db/drizzle');

import { auth } from '../../src/lib/auth';
import { db } from '../../src/db/drizzle';
import { GET, PATCH } from '../../src/app/api/admin/users/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe('/api/admin/users', () => {
  const adminSession = { user: { id: 'admin-1', role: 'admin' } };
  const memberSession = { user: { id: 'user-1', role: 'member' } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.api.getSession.mockResolvedValue(adminSession);
  });

  it('GET should return 401 when unauthenticated', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET should return 403 when not admin', async () => {
    mockAuth.api.getSession.mockResolvedValue(memberSession);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('GET should return list of users for admin', async () => {
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
    };
    mockDb.select = vi.fn().mockReturnValue(mockQuery);
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('PATCH should update role for admin', async () => {
    const mockUpdate = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue({}) };
    mockDb.update = vi.fn().mockReturnValue(mockUpdate);

    const req = new Request('http://localhost:3000/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-2', role: 'admin' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('PATCH should return 400 for invalid payload', async () => {
    const req = new Request('http://localhost:3000/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ bad: 'data' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('PATCH should return 403 when not admin', async () => {
    mockAuth.api.getSession.mockResolvedValue(memberSession);
    const req = new Request('http://localhost:3000/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-2', role: 'member' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });
});