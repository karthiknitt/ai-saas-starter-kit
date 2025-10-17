import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, TypedSession } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

  return (
    <div className="p-10">
      <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome {session.user.name ?? session.user.email}. You have admin
        access.
      </p>
      {/* Add your admin widgets here */}
    </div>
  );
}
