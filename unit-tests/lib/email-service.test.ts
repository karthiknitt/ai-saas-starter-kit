import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emailService,
  sendPaymentFailureEmail,
  sendPaymentSuccessEmail,
  sendQuotaWarningEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionConfirmationEmail,
  sendWorkspaceInvitationEmail,
} from '@/lib/email-service';

// Mock Resend
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(function() {
      return {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: { id: 'test_email_id' },
            error: null,
          }),
        },
      };
    }),
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock email components
vi.mock('@/components/emails/subscription-confirmation', () => ({
  default: vi.fn(() => 'SubscriptionConfirmationEmail'),
}));

vi.mock('@/components/emails/payment-success', () => ({
  default: vi.fn(() => 'PaymentSuccessEmail'),
}));

vi.mock('@/components/emails/payment-failure', () => ({
  default: vi.fn(() => 'PaymentFailureEmail'),
}));

vi.mock('@/components/emails/quota-warning', () => ({
  default: vi.fn(() => 'QuotaWarningEmail'),
}));

vi.mock('@/components/emails/subscription-cancelled', () => ({
  default: vi.fn(() => 'SubscriptionCancelledEmail'),
}));

vi.mock('@/components/emails/workspace-invitation', () => ({
  default: vi.fn(() => 'WorkspaceInvitationEmail'),
}));

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

describe('Email Service', () => {
  let resendMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.RESEND_API_KEY = 'test_api_key';
    process.env.RESEND_SENDER_EMAIL = 'test@example.com';

    // Get the mock Resend instance
    resendMock = new Resend();
  });

  describe('sendSubscriptionConfirmationEmail', () => {
    it('should send subscription confirmation email successfully', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendSubscriptionConfirmationEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        billingCycle: 'monthly',
        nextBillingDate: '2024-02-01',
        amount: '$19',
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Welcome to Pro! 🎉',
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Subscription confirmation email sent',
        expect.any(Object),
      );
    });

    it('should handle Resend errors', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: null,
        error: { message: 'Send failed' },
      });

      const result = await sendSubscriptionConfirmationEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        billingCycle: 'monthly',
        nextBillingDate: '2024-02-01',
        amount: '$19',
      });

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should catch exceptions', async () => {
      resendMock.emails.send.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendSubscriptionConfirmationEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        billingCycle: 'monthly',
        nextBillingDate: '2024-02-01',
        amount: '$19',
      });

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('sendPaymentSuccessEmail', () => {
    it('should send payment success email successfully', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendPaymentSuccessEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        amount: '$19',
        paymentDate: '2024-01-15',
        invoiceUrl: 'https://example.com/invoice',
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Payment Received - Thank You!',
        }),
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle missing optional invoiceUrl', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendPaymentSuccessEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        amount: '$19',
        paymentDate: '2024-01-15',
      });

      expect(resendMock.emails.send).toHaveBeenCalled();
    });
  });

  describe('sendPaymentFailureEmail', () => {
    it('should send payment failure email successfully', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendPaymentFailureEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        amount: '$19',
        failureReason: 'Insufficient funds',
        retryDate: '2024-01-20',
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: '⚠️ Payment Failed - Action Required',
        }),
      );
    });

    it('should handle missing optional fields', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendPaymentFailureEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        amount: '$19',
      });

      expect(resendMock.emails.send).toHaveBeenCalled();
    });
  });

  describe('sendQuotaWarningEmail', () => {
    it('should send 80% quota warning email', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendQuotaWarningEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Free',
        usagePercentage: 80,
        quotaUsed: 8,
        quotaLimit: 10,
        resetDate: '2024-02-01',
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '⚠️ 80% of Your Quota Used',
        }),
      );
    });

    it('should send 90% quota warning email', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendQuotaWarningEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Free',
        usagePercentage: 90,
        quotaUsed: 9,
        quotaLimit: 10,
        resetDate: '2024-02-01',
      });

      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '⚠️ 90% of Your Quota Used',
        }),
      );
    });

    it('should send 100% quota warning email', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendQuotaWarningEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Free',
        usagePercentage: 100,
        quotaUsed: 10,
        quotaLimit: 10,
        resetDate: '2024-02-01',
      });

      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '⚠️ Usage Limit Reached',
        }),
      );
    });
  });

  describe('sendSubscriptionCancelledEmail', () => {
    it('should send subscription cancelled email successfully', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendSubscriptionCancelledEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        endDate: '2024-02-01',
        cancellationReason: 'User request',
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Subscription Cancelled',
        }),
      );
    });

    it('should handle missing optional cancellationReason', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendSubscriptionCancelledEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        endDate: '2024-02-01',
      });

      expect(resendMock.emails.send).toHaveBeenCalled();
    });
  });

  describe('sendWorkspaceInvitationEmail', () => {
    it('should send workspace invitation email successfully', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWorkspaceInvitationEmail({
        to: 'user@example.com',
        inviteeName: 'New User',
        inviterName: 'Test User',
        workspaceName: 'Acme Corp',
        role: 'member',
        invitationUrl: 'https://example.com/accept-invitation?token=abc',
        expiresInDays: 7,
      });

      expect(result.success).toBe(true);
      expect(resendMock.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test User invited you to join Acme Corp',
        }),
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should use default expiry of 7 days', async () => {
      resendMock.emails.send.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWorkspaceInvitationEmail({
        to: 'user@example.com',
        inviteeName: 'New User',
        inviterName: 'Test User',
        workspaceName: 'Acme Corp',
        role: 'member',
        invitationUrl: 'https://example.com/accept',
      });

      expect(resendMock.emails.send).toHaveBeenCalled();
    });
  });

  describe('emailService interface', () => {
    it('should expose all email functions', () => {
      expect(emailService.sendSubscriptionConfirmation).toBeDefined();
      expect(emailService.sendPaymentSuccess).toBeDefined();
      expect(emailService.sendPaymentFailure).toBeDefined();
      expect(emailService.sendQuotaWarning).toBeDefined();
      expect(emailService.sendSubscriptionCancelled).toBeDefined();
      expect(emailService.sendWorkspaceInvitation).toBeDefined();
    });

    it('should be mockable for testing', () => {
      const mockEmailService = {
        sendSubscriptionConfirmation: vi.fn(),
        sendPaymentSuccess: vi.fn(),
        sendPaymentFailure: vi.fn(),
        sendQuotaWarning: vi.fn(),
        sendSubscriptionCancelled: vi.fn(),
        sendWorkspaceInvitation: vi.fn(),
      };

      expect(mockEmailService.sendSubscriptionConfirmation).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      resendMock.emails.send.mockRejectedValueOnce('string error');

      const result = await sendSubscriptionConfirmationEmail({
        to: 'user@example.com',
        username: 'Test User',
        planName: 'Pro',
        billingCycle: 'monthly',
        nextBillingDate: '2024-02-01',
        amount: '$19',
      });

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
