'use client';

import { useRouter } from 'next/navigation';
import type { ErrorInfo } from '@/types/error';

export default function AdminError({ error, unstable_retry }: ErrorInfo) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Admin error</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          {error.message || 'Failed to load admin panel. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={unstable_retry}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
