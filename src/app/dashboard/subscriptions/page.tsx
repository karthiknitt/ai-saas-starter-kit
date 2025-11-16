'use client';

import { useEffect, useState } from 'react';
import {
  PageErrorBoundary,
  SectionErrorBoundary,
} from '@/components/error-boundary';
import { CardLoader, PageLoader } from '@/components/loading-states';
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
      const slug = planName.toLowerCase();

      // Free plan doesn't require checkout
      if (slug === 'free') {
        alert('You are already on the free plan');
        return;
      }

      if (!['pro', 'startup'].includes(slug)) {
        console.error('Invalid plan name:', planName);
        return;
      }

      // Call checkout API
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: slug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Checkout failed');
      }

      const { url } = await response.json();

      // Redirect to Polar checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
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
    return <PageLoader />;
  }

  return (
    <PageErrorBoundary>
      <div className="container mx-auto space-y-8 px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription, upgrade or downgrade plans.
          </p>
        </div>

        {/* Current Subscription */}
        <SectionErrorBoundary title="Current Subscription">
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Subscription status will be displayed here.</p>
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        {/* Plans */}
        <SectionErrorBoundary title="Subscription Plans">
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
        </SectionErrorBoundary>

        {/* Payment History */}
        <SectionErrorBoundary title="Payment History">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No payment history available.</p>
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
}
