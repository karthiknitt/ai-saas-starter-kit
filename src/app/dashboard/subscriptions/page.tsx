'use client';

import { polarClient, PLAN_PRODUCT_IDS } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionsPage() {
  const handlePlanSelection = async (planName: string) => {
    try {
      // Get product ID from constants
      const productIds = {
        free: PLAN_PRODUCT_IDS.FREE,
        pro: PLAN_PRODUCT_IDS.PRO,
        startup: PLAN_PRODUCT_IDS.STARTUP,
      };

      const productId =
        productIds[planName.toLowerCase() as keyof typeof productIds];
      if (!productId) {
        console.error('Invalid plan name:', planName);
        return;
      }

      await polarClient.createCheckout(productId);
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const plans = [
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
        {plans.map(plan => (
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
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                onClick={() => handlePlanSelection(plan.name)}
                disabled={plan.name === 'Free'}
              >
                {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
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
