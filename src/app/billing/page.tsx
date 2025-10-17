'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [plan, setPlan] = useState<string>('Loading...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        // TODO: Implement customer state fetching when polar is properly configured
        setPlan('Free');
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
      <Button
        onClick={() => alert('Customer portal not yet implemented')}
        className="mt-4"
      >
        Manage Subscription
      </Button>
    </div>
  );
}
