import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth, type TypedSession } from '@/lib/auth';
import { AuditLogsClient } from '@/components/audit-logs-client';

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
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          View all system audit logs and administrative actions
        </p>
      </div>

      <AuditLogsClient />
    </div>
  );
}
