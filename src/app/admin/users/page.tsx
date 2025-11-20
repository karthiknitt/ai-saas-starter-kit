import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AdminUsersPageClient } from '@/components/admin-users-page-client';
import { TableLoader } from '@/components/loading-states';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema';
import { auth, type TypedSession } from '@/lib/auth';

interface AdminUsersPageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
  };
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;
  if (!session) redirect('/login');
  const role = session.user.role;
  if (role !== 'admin') redirect('/dashboard');

  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.pageSize || '10', 10)),
  );
  const offset = (page - 1) * pageSize;

  // Fetch users with pagination
  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
    })
    .from(userTable)
    .orderBy(userTable.id)
    .limit(pageSize)
    .offset(offset);

  // Fetch total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userTable);

  const totalPages = Math.ceil(count / pageSize);

  return (
    <Suspense fallback={<TableLoader />}>
      <AdminUsersPageClient
        currentUser={session.user}
        users={users}
        pagination={{
          currentPage: page,
          pageSize,
          totalCount: count,
          totalPages,
        }}
      />
    </Suspense>
  );
}
