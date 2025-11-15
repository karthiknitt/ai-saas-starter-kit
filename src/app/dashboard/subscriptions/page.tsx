'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';

interface Plan {
  name: string;
  price: string;
  features: string[];
}

export default function SubscriptionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handlePlanSelection = async (planName: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to purchase a plan');
      return;
    }

    try {
      console.log('Starting checkout for plan:', planName);
      // Use the slug directly as configured in server
      const slug = planName.toLowerCase();
      if (!['free', 'pro', 'startup'].includes(slug)) {
        console.error('Invalid plan name:', planName);
        return;
      }

      // TODO: Implement checkout when polar is properly configured
      console.log('Checkout not yet implemented for plan:', planName);
      alert(`Checkout not yet implemented for ${planName} plan`);
      return;
    } catch (error) {
      console.error('Checkout failed:', error);
      // Show user-friendly error message
      alert(
        `Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };
  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0/mo',
      features: [
        'Basic Analytics Dashboard',
        '5GB Cloud Storage',
        'Email and Chat Support',
      ],
    },
    {
      name: 'Pro',
      price: '$19/mo',
      features: [
        'Everything in Free',
        'Access to Community Forum',
        'Single User Access',
        'Access to Basic Templates',
        'Mobile App Access',
        '1 Custom Report Per Month',
        'Monthly Product Updates',
        'Standard Security Features',
      ],
    },
    {
      name: 'Startup',
      price: '$29/mo',
      features: [
        'Everything in Pro Plan',
        '5GB Cloud Storage',
        'Email and Chat Support',
      ],
    },
  ];

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto space-y-8 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription, upgrade or downgrade plans.
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Subscription status will be displayed here.</p>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.name === 'Pro' ? 'border-purple-500' : ''}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-semibold">{plan.price}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                onClick={() => handlePlanSelection(plan.name)}
                disabled={plan.name !== 'Free' && !isAuthenticated}
              >
                {plan.name === 'Free'
                  ? 'Current Plan'
                  : isAuthenticated
                    ? 'Upgrade'
                    : 'Sign in to purchase'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No payment history available.</p>
        </CardContent>
      </Card>
    </div>
  );
}
