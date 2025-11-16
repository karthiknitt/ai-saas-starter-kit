/**
 * Analytics Dashboard Page
 *
 * Displays usage analytics, trends, and insights for users.
 * Shows AI model usage, response times, error rates, and request volumes.
 *
 * @module app/dashboard/analytics
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AnalyticsClient } from '@/components/analytics-client';
import { DashboardLoader } from '@/components/loading-states';
import { auth, type TypedSession } from '@/lib/auth';

export const metadata = {
  title: 'Analytics | AI SaaS',
  description: 'View your usage analytics and insights',
};

export default async function AnalyticsPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track your AI usage, performance metrics, and trends
        </p>
      </div>

      <Suspense fallback={<DashboardLoader />}>
        <AnalyticsClient userId={session.user.id} />
      </Suspense>
    </div>
  );
}
