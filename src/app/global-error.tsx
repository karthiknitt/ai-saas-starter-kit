'use client';

import type { ErrorInfo } from '@/types/error';

// Prevent static generation of this error page
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Note: global-error.tsx must be a client component per Next.js requirements.
// It replaces the root layout on catastrophic errors, so it must render <html>.
// Uses unstable_retry for proper RSC re-fetch (router.refresh + reset in a transition).
export default function GlobalError({ error, unstable_retry }: ErrorInfo) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong!</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={unstable_retry}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
