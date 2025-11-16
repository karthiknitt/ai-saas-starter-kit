/**
 * Session Management Page
 *
 * Allows users to view and manage their active sessions.
 *
 * @module app/dashboard/sessions
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { TableLoader } from '@/components/loading-states';
import { SessionsClient } from '@/components/sessions-client';
import { auth, type TypedSession } from '@/lib/auth';

export const metadata = {
  title: 'Sessions | AI SaaS',
  description: 'Manage your active sessions',
};

export default async function SessionsPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Active Sessions</h1>
        <p className="text-gray-600 mt-2">
          Manage your active login sessions across devices
        </p>
      </div>

      <Suspense fallback={<TableLoader />}>
        <SessionsClient />
      </Suspense>
    </div>
  );
}
