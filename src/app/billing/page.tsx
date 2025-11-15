'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        // Fetch subscription data
        const subResponse = await fetch('/api/billing/subscription');
        if (subResponse.ok) {
          const subData = await subResponse.json();
          setSubscription(subData.subscription);
        }

        // Fetch usage data
        const usageResponse = await fetch('/api/billing/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsage(usageData.quota);
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    }
    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan || 'Free';
  const status = subscription?.status || 'active';
  const isActive = status === 'active';
  const isCanceled = status === 'canceled' || subscription?.cancelAtPeriodEnd;

  const getStatusBadge = () => {
    if (isCanceled) {
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Canceled</Badge>;
    }
    if (isActive) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>;
    }
    return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsagePercentage = () => {
    if (!usage || usage.unlimited || usage.limit === -1) return 0;
    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and view your usage
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your current plan and billing information</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-2xl font-bold">{plan}</p>
            </div>
            {subscription && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-medium capitalize">{status}</p>
                </div>
                {subscription.currentPeriodStart && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Period Start</p>
                    <p className="text-lg font-medium">{formatDate(subscription.currentPeriodStart)}</p>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isCanceled ? 'Cancels On' : 'Renews On'}
                    </p>
                    <p className="text-lg font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="flex gap-4">
            <Link href="/dashboard/subscriptions">
              <Button>
                {plan === 'Free' ? 'Upgrade Plan' : 'Change Plan'}
              </Button>
            </Link>
            {subscription && isActive && !isCanceled && plan !== 'Free' && (
              <Button variant="outline" disabled>
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Information */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Track your AI request usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage.unlimited ? (
              <div className="text-center py-6">
                <p className="text-lg font-semibold">Unlimited AI Requests</p>
                <p className="text-muted-foreground text-sm">Your plan includes unlimited AI requests</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>AI Requests</span>
                    <span className="font-medium">
                      {usage.used} / {usage.limit === -1 ? '∞' : usage.limit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${
                        getUsagePercentage() >= 90
                          ? 'bg-destructive'
                          : getUsagePercentage() >= 75
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {usage.remaining} requests remaining
                  </p>
                </div>

                {getUsagePercentage() >= 80 && (
                  <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium">
                        {getUsagePercentage() >= 90
                          ? '⚠️ You\'re almost out of AI requests!'
                          : '⚠️ You\'re approaching your AI request limit'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Consider upgrading your plan to avoid interruptions.
                      </p>
                      <Link href="/dashboard/subscriptions">
                        <Button size="sm" className="mt-3">
                          Upgrade Plan
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>What's included in your {plan} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan === 'Free' && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>10 AI requests per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Access to GPT-3.5 Turbo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>1 API key</span>
                </li>
              </>
            )}
            {plan === 'Pro' && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>1,000 AI requests per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Access to GPT-4, Claude 3.5 Sonnet, and more</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Up to 5 API keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Priority support</span>
                </li>
              </>
            )}
            {plan === 'Startup' && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Unlimited AI requests</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Access to all AI models</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Unlimited API keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Priority support & dedicated account manager</span>
                </li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
