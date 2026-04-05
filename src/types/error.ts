/**
 * Next.js 16.2 error boundary props.
 * error.digest is added at runtime but not in the public type;
 * we intersect to make it accessible without unsafe casting.
 * unstable_retry performs proper RSC re-fetch (router.refresh + reset in a transition).
 */
export type ErrorInfo = {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry: () => void;
};
