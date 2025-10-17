import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth, TypedSession } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;
  if (!session) return { ok: false as const, code: 401 as const };
  const role = session.user.role;
  if (role !== 'admin') return { ok: false as const, code: 403 as const };
  return { ok: true as const, session };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.code });

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
    })
    .from(userTable);
  return NextResponse.json({ users: rows }, { status: 200 });
}

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['member', 'admin']),
});

export async function PATCH(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.code });

  const body = await request.json().catch(() => null);
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { userId, role } = parsed.data;
  await db.update(userTable).set({ role }).where(eq(userTable.id, userId));
  return NextResponse.json({ success: true });
}
