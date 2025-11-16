/**
 * Webhook Event Processor
 *
 * Provides reliable webhook processing with automatic retry and dead letter queue.
 * Implements exponential backoff retry strategy to handle transient failures.
 *
 * Features:
 * - Persistent webhook event storage
 * - Automatic retry with exponential backoff (1s, 2s, 4s)
 * - Dead letter queue for permanently failed events
 * - Event status tracking and monitoring
 *
 * @module webhook-processor
 */

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { webhookEvent } from '@/db/schema';
import { logger } from '@/lib/logger';

/** Maximum number of retry attempts before moving to dead letter queue */
const MAX_RETRY_ATTEMPTS = 3;

/** Retry delays in milliseconds (exponential backoff: 1s, 2s, 4s) */
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Webhook processor function type
 * Takes the event payload and returns a promise that resolves when processing is complete
 */
export type WebhookProcessor = (payload: unknown) => Promise<void>;

/**
 * Log an incoming webhook event
 *
 * @param source - Webhook source (e.g., 'polar', 'stripe')
 * @param eventType - Event type from webhook payload
 * @param payload - Complete webhook payload
 * @returns Event ID for tracking
 */
export async function logWebhookEvent(
  source: string,
  eventType: string,
  payload: unknown,
): Promise<string> {
  const eventId = nanoid();

  try {
    await db.insert(webhookEvent).values({
      id: eventId,
      source,
      eventType,
      payload: JSON.stringify(payload),
      status: 'pending',
      retryCount: 0,
    });

    logger.info('Webhook event logged', { eventId, source, eventType });
    return eventId;
  } catch (error) {
    logger.error('Failed to log webhook event', {
      error: error instanceof Error ? error.message : String(error),
      source,
      eventType,
    });
    throw error;
  }
}

/**
 * Process a webhook event with automatic retry
 *
 * @param eventId - Webhook event ID
 * @param processor - Function to process the webhook payload
 * @returns Processing result
 */
export async function processWebhookEvent(
  eventId: string,
  processor: WebhookProcessor,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get event from database
    const event = await db.query.webhookEvent.findFirst({
      where: eq(webhookEvent.id, eventId),
    });

    if (!event) {
      logger.error('Webhook event not found', { eventId });
      return { success: false, error: 'Event not found' };
    }

    // Check if already processed
    if (event.status === 'success') {
      logger.info('Webhook event already processed', { eventId });
      return { success: true };
    }

    // Check if exceeded max retries
    if (event.retryCount >= MAX_RETRY_ATTEMPTS) {
      logger.error('Webhook event exceeded max retries', {
        eventId,
        retryCount: event.retryCount,
      });

      await db
        .update(webhookEvent)
        .set({
          status: 'failed',
          lastError: 'Exceeded maximum retry attempts',
        })
        .where(eq(webhookEvent.id, eventId));

      return { success: false, error: 'Exceeded max retries' };
    }

    // Mark as processing
    await db
      .update(webhookEvent)
      .set({ status: 'processing' })
      .where(eq(webhookEvent.id, eventId));

    try {
      // Parse payload and process
      const payload = JSON.parse(event.payload);
      await processor(payload);

      // Mark as successful
      await db
        .update(webhookEvent)
        .set({
          status: 'success',
          processedAt: new Date(),
        })
        .where(eq(webhookEvent.id, eventId));

      logger.info('Webhook event processed successfully', { eventId });
      return { success: true };
    } catch (processingError) {
      // Processing failed - increment retry count and schedule retry
      const newRetryCount = event.retryCount + 1;
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown error';

      await db
        .update(webhookEvent)
        .set({
          status: 'pending',
          retryCount: newRetryCount,
          lastError: errorMessage,
        })
        .where(eq(webhookEvent.id, eventId));

      logger.warn('Webhook event processing failed, will retry', {
        eventId,
        retryCount: newRetryCount,
        error: errorMessage,
      });

      // Schedule retry with exponential backoff
      if (newRetryCount <= MAX_RETRY_ATTEMPTS) {
        const delay =
          RETRY_DELAYS[newRetryCount - 1] ||
          RETRY_DELAYS[RETRY_DELAYS.length - 1];

        setTimeout(() => {
          processWebhookEvent(eventId, processor).catch((err) => {
            logger.error('Retry failed', { eventId, error: err });
          });
        }, delay);
      }

      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing webhook event', {
      eventId,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Process webhook event immediately (synchronous)
 * Use this for real-time webhook processing
 *
 * @param source - Webhook source
 * @param eventType - Event type
 * @param payload - Webhook payload
 * @param processor - Processing function
 * @returns Event ID and processing result
 */
export async function processWebhookNow(
  source: string,
  eventType: string,
  payload: unknown,
  processor: WebhookProcessor,
): Promise<{ eventId: string; success: boolean; error?: string }> {
  // Log the event first
  const eventId = await logWebhookEvent(source, eventType, payload);

  // Process immediately
  const result = await processWebhookEvent(eventId, processor);

  return { eventId, ...result };
}

/**
 * Get webhook events by status
 *
 * @param status - Event status to filter by
 * @param limit - Maximum number of events to return
 * @returns List of webhook events
 */
export async function getWebhookEventsByStatus(status: string, limit = 100) {
  return await db.query.webhookEvent.findMany({
    where: eq(webhookEvent.status, status),
    limit,
    orderBy: [webhookEvent.createdAt],
  });
}

/**
 * Manually retry a failed webhook event
 *
 * @param eventId - Webhook event ID
 * @param processor - Processing function
 * @returns Processing result
 */
export async function retryWebhookEvent(
  eventId: string,
  processor: WebhookProcessor,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset retry count to give it a fresh start
    await db
      .update(webhookEvent)
      .set({
        status: 'pending',
        retryCount: 0,
        lastError: null,
      })
      .where(eq(webhookEvent.id, eventId));

    logger.info('Manual retry initiated', { eventId });

    // Process the event
    return await processWebhookEvent(eventId, processor);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Manual retry failed', { eventId, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get webhook event statistics
 *
 * @returns Statistics by status
 */
export async function getWebhookStats() {
  const events = await db.query.webhookEvent.findMany();

  const stats = {
    total: events.length,
    pending: 0,
    processing: 0,
    success: 0,
    failed: 0,
  };

  for (const event of events) {
    switch (event.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'processing':
        stats.processing++;
        break;
      case 'success':
        stats.success++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  }

  return stats;
}
