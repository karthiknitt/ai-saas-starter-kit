'use client';

// Prevent static generation of this error page
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Note: global-error.tsx must be a client component per Next.js requirements
// However, we keep it minimal to avoid prerender issues
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong!</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <button
            type="button"
            onClick={reset}
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
