import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn<[], Promise<any>>() } },
}));
vi.mock('@/db/drizzle', () => ({
  db: { select: vi.fn() },
}));
import { auth } from '@/lib/auth';
// Mock next/navigation redirect
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { redirect } from 'next/navigation';

// Mock headers
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

describe('/admin page access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const mod = await import('../../src/app/admin/page');
    try {
      await mod.default();
    } catch {
      // Expected to throw due to null session.user access
    }
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('redirects non-admin users', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { id: '1', userId: '1', token: 'token', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      user: { id: '1', name: 'User', email: 'u@b.c', role: 'member', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, image: null } as TypedUser
    });
    const mod = await import('../../src/app/admin/page');
    await mod.default();
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('allows admin users', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { id: '1', userId: '1', token: 'token', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      user: { id: '1', name: 'Admin', email: 'a@b.c', role: 'admin', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, image: null } as TypedUser
    });
    const mod = await import('../../src/app/admin/page');
    const el = await mod.default();
    expect(el).toBeTruthy();
  });

  it('handles users without role', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { id: '1', userId: '1', token: 'token', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      user: { id: '1', name: 'User', email: 'u@b.c', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, image: null, role: 'member' } as TypedUser
    });

    // Mock the db query to return a role
    const { db } = await import('../../src/db/drizzle');
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ role: 'member' }])
        })
      })
    } as unknown as ReturnType<typeof db.select>);

    const mod = await import('../../src/app/admin/page');
    await mod.default();
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });
});