/**
 * Email Service
 *
 * Centralized email sending service using Resend.
 * Provides functions to send transactional emails for various events:
 * - Subscription confirmations
 * - Payment success/failure notifications
 * - Usage quota warnings
 * - Subscription cancellations
 *
 * @module email-service
 */

import { Resend } from "resend";
import { logger } from "@/lib/logger";
import SubscriptionConfirmationEmail from "@/components/emails/subscription-confirmation";
import PaymentSuccessEmail from "@/components/emails/payment-success";
import PaymentFailureEmail from "@/components/emails/payment-failure";
import QuotaWarningEmail from "@/components/emails/quota-warning";
import SubscriptionCancelledEmail from "@/components/emails/subscription-cancelled";

/** Resend client instance */
const resend = new Resend(process.env.RESEND_API_KEY);

/** Default sender email address */
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || "noreply@example.com";

/**
 * Send subscription confirmation email
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.username - User's name
 * @param params.planName - Subscription plan name
 * @param params.billingCycle - Billing cycle (monthly/yearly)
 * @param params.nextBillingDate - Next billing date
 * @param params.amount - Subscription amount
 * @returns Promise with email sending result
 */
export async function sendSubscriptionConfirmationEmail(params: {
	to: string;
	username: string;
	planName: string;
	billingCycle: string;
	nextBillingDate: string;
	amount: string;
}) {
	try {
		const { data, error } = await resend.emails.send({
			from: SENDER_EMAIL,
			to: params.to,
			subject: `Welcome to ${params.planName}! 🎉`,
			react: SubscriptionConfirmationEmail({
				username: params.username,
				planName: params.planName,
				billingCycle: params.billingCycle,
				nextBillingDate: params.nextBillingDate,
				amount: params.amount,
			}),
		});

		if (error) {
			logger.error("Failed to send subscription confirmation email", {
				error,
				recipient: params.to,
			});
			throw error;
		}

		logger.info("Subscription confirmation email sent", {
			emailId: data?.id,
			recipient: params.to,
			plan: params.planName,
		});

		return { success: true, data };
	} catch (error) {
		logger.error("Error sending subscription confirmation email", { error });
		return { success: false, error };
	}
}

/**
 * Send payment success email
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.username - User's name
 * @param params.planName - Subscription plan name
 * @param params.amount - Payment amount
 * @param params.paymentDate - Payment date
 * @param params.invoiceUrl - Optional invoice URL
 * @returns Promise with email sending result
 */
export async function sendPaymentSuccessEmail(params: {
	to: string;
	username: string;
	planName: string;
	amount: string;
	paymentDate: string;
	invoiceUrl?: string;
}) {
	try {
		const { data, error } = await resend.emails.send({
			from: SENDER_EMAIL,
			to: params.to,
			subject: "Payment Received - Thank You!",
			react: PaymentSuccessEmail({
				username: params.username,
				planName: params.planName,
				amount: params.amount,
				paymentDate: params.paymentDate,
				invoiceUrl: params.invoiceUrl,
			}),
		});

		if (error) {
			logger.error("Failed to send payment success email", {
				error,
				recipient: params.to,
			});
			throw error;
		}

		logger.info("Payment success email sent", {
			emailId: data?.id,
			recipient: params.to,
			amount: params.amount,
		});

		return { success: true, data };
	} catch (error) {
		logger.error("Error sending payment success email", { error });
		return { success: false, error };
	}
}

/**
 * Send payment failure email
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.username - User's name
 * @param params.planName - Subscription plan name
 * @param params.amount - Payment amount
 * @param params.failureReason - Optional failure reason
 * @param params.retryDate - Optional retry date
 * @returns Promise with email sending result
 */
export async function sendPaymentFailureEmail(params: {
	to: string;
	username: string;
	planName: string;
	amount: string;
	failureReason?: string;
	retryDate?: string;
}) {
	try {
		const { data, error } = await resend.emails.send({
			from: SENDER_EMAIL,
			to: params.to,
			subject: "⚠️ Payment Failed - Action Required",
			react: PaymentFailureEmail({
				username: params.username,
				planName: params.planName,
				amount: params.amount,
				failureReason: params.failureReason,
				retryDate: params.retryDate,
			}),
		});

		if (error) {
			logger.error("Failed to send payment failure email", {
				error,
				recipient: params.to,
			});
			throw error;
		}

		logger.info("Payment failure email sent", {
			emailId: data?.id,
			recipient: params.to,
			amount: params.amount,
		});

		return { success: true, data };
	} catch (error) {
		logger.error("Error sending payment failure email", { error });
		return { success: false, error };
	}
}

/**
 * Send quota warning email
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.username - User's name
 * @param params.planName - Subscription plan name
 * @param params.usagePercentage - Usage percentage (80, 90, or 100)
 * @param params.quotaUsed - Number of requests used
 * @param params.quotaLimit - Total quota limit
 * @param params.resetDate - Quota reset date
 * @returns Promise with email sending result
 */
export async function sendQuotaWarningEmail(params: {
	to: string;
	username: string;
	planName: string;
	usagePercentage: number;
	quotaUsed: number;
	quotaLimit: number;
	resetDate: string;
}) {
	try {
		const subject =
			params.usagePercentage >= 100
				? "⚠️ Usage Limit Reached"
				: `⚠️ ${params.usagePercentage}% of Your Quota Used`;

		const { data, error } = await resend.emails.send({
			from: SENDER_EMAIL,
			to: params.to,
			subject,
			react: QuotaWarningEmail({
				username: params.username,
				planName: params.planName,
				usagePercentage: params.usagePercentage,
				quotaUsed: params.quotaUsed,
				quotaLimit: params.quotaLimit,
				resetDate: params.resetDate,
			}),
		});

		if (error) {
			logger.error("Failed to send quota warning email", {
				error,
				recipient: params.to,
			});
			throw error;
		}

		logger.info("Quota warning email sent", {
			emailId: data?.id,
			recipient: params.to,
			usagePercentage: params.usagePercentage,
		});

		return { success: true, data };
	} catch (error) {
		logger.error("Error sending quota warning email", { error });
		return { success: false, error };
	}
}

/**
 * Send subscription cancelled email
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.username - User's name
 * @param params.planName - Subscription plan name
 * @param params.endDate - Subscription end date
 * @param params.cancellationReason - Optional cancellation reason
 * @returns Promise with email sending result
 */
export async function sendSubscriptionCancelledEmail(params: {
	to: string;
	username: string;
	planName: string;
	endDate: string;
	cancellationReason?: string;
}) {
	try {
		const { data, error } = await resend.emails.send({
			from: SENDER_EMAIL,
			to: params.to,
			subject: "Subscription Cancelled",
			react: SubscriptionCancelledEmail({
				username: params.username,
				planName: params.planName,
				endDate: params.endDate,
				cancellationReason: params.cancellationReason,
			}),
		});

		if (error) {
			logger.error("Failed to send subscription cancelled email", {
				error,
				recipient: params.to,
			});
			throw error;
		}

		logger.info("Subscription cancelled email sent", {
			emailId: data?.id,
			recipient: params.to,
			plan: params.planName,
		});

		return { success: true, data };
	} catch (error) {
		logger.error("Error sending subscription cancelled email", { error });
		return { success: false, error };
	}
}

/**
 * Email service interface for easy testing and mocking
 */
export const emailService = {
	sendSubscriptionConfirmation: sendSubscriptionConfirmationEmail,
	sendPaymentSuccess: sendPaymentSuccessEmail,
	sendPaymentFailure: sendPaymentFailureEmail,
	sendQuotaWarning: sendQuotaWarningEmail,
	sendSubscriptionCancelled: sendSubscriptionCancelledEmail,
};
