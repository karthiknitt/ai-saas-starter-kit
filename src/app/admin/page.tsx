import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminPageClient } from '@/components/admin-page-client';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { auth, type TypedSession } from '@/lib/auth';

export default async function AdminPage() {
  // Strict server-side check: ensure user is authenticated and has admin role
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    redirect('/');
  }

  // In case role is not included in the session payload, fetch from DB
  let role = session.user.role;
  if (!role) {
    const rows = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);
    role = rows[0]?.role || 'member';
  }

  if (role !== 'admin') {
    redirect('/');
  }

  return <AdminPageClient user={session.user} />;
}
