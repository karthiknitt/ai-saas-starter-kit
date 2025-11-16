/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for server-side error tracking and performance monitoring.
 * It runs on the Next.js server and captures API errors, SSR errors, and server performance data.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Uncomment these imports when Sentry is installed:
// import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

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
  //   // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  //   // spotlight: process.env.NODE_ENV === 'development',
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
