import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWebhookEventsByStatus,
  getWebhookStats,
  logWebhookEvent,
  processWebhookEvent,
  processWebhookNow,
  retryWebhookEvent,
} from '@/lib/webhook-processor';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    query: {
      webhookEvent: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { db } from '@/db/drizzle';
import { logger } from '@/lib/logger';

describe('Webhook Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('logWebhookEvent', () => {
    it('should log webhook event successfully', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const payload = { type: 'subscription.created', data: { id: '123' } };
      const eventId = await logWebhookEvent('polar', 'subscription.created', payload);

      expect(eventId).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Webhook event logged',
        expect.objectContaining({
          eventId,
          source: 'polar',
          eventType: 'subscription.created',
        }),
      );
    });

    it('should throw error on database failure', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('DB error')),
      } as any);

      await expect(
        logWebhookEvent('polar', 'test', {}),
      ).rejects.toThrow('DB error');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should serialize payload as JSON', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      const payload = { nested: { data: 'value' } };
      await logWebhookEvent('polar', 'test', payload);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: JSON.stringify(payload),
        }),
      );
    });
  });

  describe('processWebhookEvent', () => {
    it('should process webhook event successfully', async () => {
      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 0,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockResolvedValue(undefined);
      const result = await processWebhookEvent('event_123', processor);

      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalledWith({ data: 'test' });
      expect(logger.info).toHaveBeenCalledWith(
        'Webhook event processed successfully',
        expect.any(Object),
      );
    });

    it('should return error if event not found', async () => {
      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(null);

      const processor = vi.fn();
      const result = await processWebhookEvent('invalid_id', processor);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(processor).not.toHaveBeenCalled();
    });

    it('should skip if already processed', async () => {
      const mockEvent = {
        id: 'event_123',
        status: 'success',
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );

      const processor = vi.fn();
      const result = await processWebhookEvent('event_123', processor);

      expect(result.success).toBe(true);
      expect(processor).not.toHaveBeenCalled();
    });

    it('should fail if exceeded max retries', async () => {
      const mockEvent = {
        id: 'event_123',
        status: 'pending',
        retryCount: 3,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn();
      const result = await processWebhookEvent('event_123', processor);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Exceeded max retries');
      expect(processor).not.toHaveBeenCalled();
    });

    it('should handle processing errors and schedule retry', async () => {
      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 0,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));
      const result = await processWebhookEvent('event_123', processor);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
      expect(logger.warn).toHaveBeenCalledWith(
        'Webhook event processing failed, will retry',
        expect.any(Object),
      );
    });

    it('should increment retry count on failure', async () => {
      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 1,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn(),
      });
      vi.mocked(db.update).mockReturnValue({
        set: setMock,
      } as any);

      const processor = vi.fn().mockRejectedValue(new Error('Fail'));
      await processWebhookEvent('event_123', processor);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          retryCount: 2,
        }),
      );
    });

    it('should handle non-Error exceptions', async () => {
      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 0,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockRejectedValue('string error');
      const result = await processWebhookEvent('event_123', processor);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('processWebhookNow', () => {
    it('should log and process webhook immediately', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 0,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockResolvedValue(undefined);
      const result = await processWebhookNow(
        'polar',
        'subscription.created',
        { data: 'test' },
        processor,
      );

      expect(result.eventId).toBeDefined();
      expect(result.success).toBe(true);
      expect(processor).toHaveBeenCalled();
    });

    it('should return error if processing fails', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 0,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockRejectedValue(new Error('Failed'));
      const result = await processWebhookNow(
        'polar',
        'test',
        {},
        processor,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed');
    });
  });

  describe('getWebhookEventsByStatus', () => {
    it('should retrieve events by status', async () => {
      const mockEvents = [
        { id: 'event_1', status: 'pending' },
        { id: 'event_2', status: 'pending' },
      ];

      vi.mocked(db.query.webhookEvent.findMany).mockResolvedValueOnce(
        mockEvents as any,
      );

      const result = await getWebhookEventsByStatus('pending');

      expect(result).toEqual(mockEvents);
    });

    it('should use default limit of 100', async () => {
      vi.mocked(db.query.webhookEvent.findMany).mockResolvedValueOnce([]);

      await getWebhookEventsByStatus('pending');

      expect(db.query.webhookEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        }),
      );
    });

    it('should accept custom limit', async () => {
      vi.mocked(db.query.webhookEvent.findMany).mockResolvedValueOnce([]);

      await getWebhookEventsByStatus('pending', 50);

      expect(db.query.webhookEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        }),
      );
    });
  });

  describe('retryWebhookEvent', () => {
    it('should reset and retry failed webhook', async () => {
      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending', // After reset, status should be pending
        retryCount: 0, // After reset, retryCount should be 0
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);
      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );

      const processor = vi.fn().mockResolvedValue(undefined);
      const result = await retryWebhookEvent('event_123', processor);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Manual retry initiated',
        expect.any(Object),
      );
    });

    it('should handle retry errors', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Update failed')),
        }),
      } as any);

      const processor = vi.fn();
      const result = await retryWebhookEvent('event_123', processor);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getWebhookStats', () => {
    it('should calculate statistics correctly', async () => {
      const mockEvents = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'processing' },
        { status: 'success' },
        { status: 'success' },
        { status: 'success' },
        { status: 'failed' },
      ];

      vi.mocked(db.query.webhookEvent.findMany).mockResolvedValueOnce(
        mockEvents as any,
      );

      const stats = await getWebhookStats();

      expect(stats.total).toBe(7);
      expect(stats.pending).toBe(2);
      expect(stats.processing).toBe(1);
      expect(stats.success).toBe(3);
      expect(stats.failed).toBe(1);
    });

    it('should return zero stats for empty events', async () => {
      vi.mocked(db.query.webhookEvent.findMany).mockResolvedValueOnce([]);

      const stats = await getWebhookStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.success).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Retry mechanism', () => {
    it('should use exponential backoff delays', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      const mockEvent = {
        id: 'event_123',
        payload: JSON.stringify({ data: 'test' }),
        status: 'pending',
        retryCount: 1,
      };

      vi.mocked(db.query.webhookEvent.findFirst).mockResolvedValue(
        mockEvent as any,
      );
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const processor = vi.fn().mockRejectedValue(new Error('Fail'));
      await processWebhookEvent('event_123', processor);

      // Verify setTimeout was called (retry was scheduled)
      expect(setTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
    });
  });
});
