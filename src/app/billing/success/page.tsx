'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');

  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    if (checkoutId) {
      // Here you could verify the checkout with Polar if needed
      setStatus('success');
      setMessage('Your subscription has been activated successfully!');
    } else {
      setStatus('error');
      setMessage('Missing checkout information');
    }
  }, [checkoutId]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p>Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        {status === 'success' ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Payment Successful!
            </h1>
            <p className="mb-6 text-gray-600">{message}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Checkout ID:{' '}
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                  {checkoutId}
                </code>
              </p>
              <Link href="/billing">
                <Button className="w-full">View Subscription Details</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Payment Error
            </h1>
            <p className="mb-6 text-gray-600">{message}</p>
            <Link href="/dashboard/subscriptions">
              <Button className="w-full">Try Again</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
