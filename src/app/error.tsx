'use client';

import type { ErrorInfo } from '@/types/error';

/**
 * Root error boundary for the application.
 *
 * Uses Next.js 16.2's unstable_retry from ErrorInfo for proper RSC re-fetch:
 * it calls router.refresh() + reset() inside a transition so the server
 * re-renders the failed subtree rather than just resetting client state.
 */
export default function AppError({ error, reset, unstable_retry }: ErrorInfo) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
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
          onClick={reset}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
