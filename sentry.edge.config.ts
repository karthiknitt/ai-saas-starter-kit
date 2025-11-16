/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for Edge Runtime (Vercel Edge Functions, Middleware).
 * It runs in the edge runtime and captures errors from middleware and edge API routes.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// This file configures the initialization of Sentry for edge features (middleware, edge routes, edge API routes).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
  // });
}

export {};
