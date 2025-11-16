/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for client-side error tracking and performance monitoring.
 * It runs in the browser and captures client-side errors and performance data.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Uncomment these imports when Sentry is installed:
// import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is provided and in production
if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //
  //   // Adjust this value in production, or use tracesSampler for greater control
  //   tracesSampleRate: 0.1,
  //
  //   // Setting this option to true will print useful information to the console while you're setting up Sentry.
  //   debug: false,
  //
  //   // Replay configuration
  //   replaysOnErrorSampleRate: 1.0,
  //   replaysSessionSampleRate: 0.1,
  //
  //   integrations: [
  //     Sentry.replayIntegration({
  //       maskAllText: true,
  //       blockAllMedia: true,
  //     }),
  //   ],
  //
  //   // Ignore common errors
  //   ignoreErrors: [
  //     'ResizeObserver loop limit exceeded',
  //     'Non-Error promise rejection captured',
  //   ],
  //
  //   // Filter out transactions from health checks
  //   beforeSend(event, hint) {
  //     // Don't send events from health check endpoints
  //     if (event.request?.url?.includes('/api/health')) {
  //       return null;
  //     }
  //     return event;
  //   },
  // });
}

export {};
