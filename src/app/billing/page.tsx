'use client';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { getPlanName } from '@/lib/plan-map';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [plan, setPlan] = useState<string>('Loading...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await authClient.customer.state();
        const state = res.data;
        if (
          state?.activeSubscriptions &&
          state.activeSubscriptions.length > 0
        ) {
          const active = state.activeSubscriptions.find(
            (s: { status: string; productId?: string }) =>
              s.status === 'active',
          );
          if (active) {
            const pid = active.productId; // Use camelCase property name
            console.log('Found active subscription:', active);
            console.log('Product ID from subscription:', pid);

            const planName = getPlanName(pid);
            console.log('Resolved plan name:', planName);
            setPlan(planName);
          } else {
            setPlan('Free');
          }
        } else {
          setPlan('Free');
        }
      } catch (error) {
        console.error('Error fetching subscription state:', error);
        setPlan('Free');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-10">
      <h1 className="mb-4 text-2xl font-bold">Billing Dashboard</h1>
      <p>Current Plan: {plan}</p>
      <Button onClick={() => authClient.customer.portal()} className="mt-4">
        Manage Subscription
      </Button>
    </div>
  );
}
