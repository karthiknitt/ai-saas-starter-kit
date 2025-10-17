import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminPage() {
  // Strict server-side check: ensure user is authenticated and has admin role
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/');
  }

  const sessionUser = session.user as {
    id: string;
    name: string | null;
    email: string;
    role?: string;
  };

  // In case role is not included in the session payload, fetch from DB
  let role = sessionUser.role;
  if (!role) {
    const rows = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, sessionUser.id))
      .limit(1);
    role = rows[0]?.role as string | undefined;
  }

  if (role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="p-10">
      <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome {sessionUser.name ?? sessionUser.email}. You have admin access.
      </p>
      {/* Add your admin widgets here */}
    </div>
  );
}
