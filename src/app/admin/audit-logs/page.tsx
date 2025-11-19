import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AdminAuditLogsPageClient } from '@/components/admin-audit-logs-page-client';
import { TableLoader } from '@/components/loading-states';
import { auth, type TypedSession } from '@/lib/auth';

export default async function AuditLogsPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    redirect('/');
  }

  // Verify admin access
  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <Suspense fallback={<TableLoader />}>
      <AdminAuditLogsPageClient user={session.user} />
    </Suspense>
  );
}
