import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { UsersClient } from '@/components/users-client';

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  const role = (session.user as { role?: string })?.role as string | undefined;
  if (role !== 'admin') redirect('/');

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
    })
    .from(userTable);

  return (
    <div className="p-10">
      <h1 className="mb-4 text-2xl font-bold">Manage Users</h1>
      <UsersClient users={users} />
    </div>
  );
}
