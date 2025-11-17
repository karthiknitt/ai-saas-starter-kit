/**
 * PostHog Analytics Integration
 *
 * Provides product analytics tracking for user behavior and feature usage.
 * Supports both client-side and server-side tracking.
 *
 * @module lib/posthog
 */

import { PostHog } from 'posthog-node';

/**
 * Server-side PostHog client for backend analytics tracking.
 * Initialized only if NEXT_PUBLIC_POSTHOG_KEY is provided.
 */
export const posthogServer = process.env.NEXT_PUBLIC_POSTHOG_KEY
  ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  : null;

/**
 * Track a server-side event in PostHog.
 *
 * @param distinctId - Unique identifier for the user (typically user ID)
 * @param event - Event name (e.g., 'user_signed_up', 'subscription_created')
 * @param properties - Additional event properties
 *
 * @example
 * ```typescript
 * await trackServerEvent(userId, 'subscription_created', {
 *   plan: 'Pro',
 *   amount: 29.99
 * });
 * ```
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (!posthogServer) {
    console.warn('PostHog is not configured');
    return;
  }

  try {
    posthogServer.capture({
      distinctId,
      event,
      properties,
    });
    await posthogServer.flush();
  } catch (error) {
    console.error('PostHog tracking error:', error);
  }
}

/**
 * Identify a user in PostHog with their properties.
 *
 * @param distinctId - Unique identifier for the user
 * @param properties - User properties (email, name, plan, etc.)
 *
 * @example
 * ```typescript
 * await identifyUser(userId, {
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   plan: 'Pro'
 * });
 * ```
 */
export async function identifyUser(
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  if (!posthogServer) {
    console.warn('PostHog is not configured');
    return;
  }

  try {
    posthogServer.identify({
      distinctId,
      properties,
    });
    await posthogServer.flush();
  } catch (error) {
    console.error('PostHog identify error:', error);
  }
}
