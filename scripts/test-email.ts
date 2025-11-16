/**
 * Email Service Test Script
 *
 * Tests email notifications to verify Resend integration.
 * Use this to test email templates and delivery.
 *
 * Usage:
 *   pnpm tsx scripts/test-email.ts your@email.com
 */

import 'dotenv/config';
import { emailService } from '../src/lib/email-service';

const testEmail = process.argv[2];

if (!testEmail) {
  console.error('❌ Please provide a test email address');
  console.log('\nUsage:');
  console.log('  pnpm tsx scripts/test-email.ts your@email.com\n');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set');
  console.log('For local testing, use Mailhog:');
  console.log('  1. docker-compose up mailhog');
  console.log('  2. View emails at http://localhost:8025\n');
}

async function testEmails() {
  console.log('📧 Testing email notifications...\n');
  console.log(`Sending test emails to: ${testEmail}\n`);

  try {
    // Test 1: Subscription Confirmation
    console.log('1️⃣  Testing Subscription Confirmation...');
    const result1 = await emailService.sendSubscriptionConfirmation({
      to: testEmail,
      username: 'Test User',
      planName: 'Pro',
      billingCycle: 'Monthly',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      amount: '$29/month',
    });

    if (result1.success) {
      console.log('✅ Subscription Confirmation sent\n');
    } else {
      console.error('❌ Failed:', result1.error, '\n');
    }

    // Test 2: Payment Success
    console.log('2️⃣  Testing Payment Success...');
    const result2 = await emailService.sendPaymentSuccess({
      to: testEmail,
      username: 'Test User',
      planName: 'Pro',
      amount: '$29.00',
      paymentDate: new Date().toLocaleDateString(),
    });

    if (result2.success) {
      console.log('✅ Payment Success sent\n');
    } else {
      console.error('❌ Failed:', result2.error, '\n');
    }

    // Test 3: Payment Failure
    console.log('3️⃣  Testing Payment Failure...');
    const result3 = await emailService.sendPaymentFailure({
      to: testEmail,
      username: 'Test User',
      planName: 'Pro',
      amount: '$29.00',
      failureReason: 'Insufficient funds',
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });

    if (result3.success) {
      console.log('✅ Payment Failure sent\n');
    } else {
      console.error('❌ Failed:', result3.error, '\n');
    }

    // Test 4: Quota Warning (80%)
    console.log('4️⃣  Testing Quota Warning (80%)...');
    const result4 = await emailService.sendQuotaWarning({
      to: testEmail,
      username: 'Test User',
      planName: 'Free',
      usagePercentage: 80,
      quotaUsed: 8,
      quotaLimit: 10,
      resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });

    if (result4.success) {
      console.log('✅ Quota Warning (80%) sent\n');
    } else {
      console.error('❌ Failed:', result4.error, '\n');
    }

    // Test 5: Quota Warning (100%)
    console.log('5️⃣  Testing Quota Warning (100%)...');
    const result5 = await emailService.sendQuotaWarning({
      to: testEmail,
      username: 'Test User',
      planName: 'Free',
      usagePercentage: 100,
      quotaUsed: 10,
      quotaLimit: 10,
      resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });

    if (result5.success) {
      console.log('✅ Quota Warning (100%) sent\n');
    } else {
      console.error('❌ Failed:', result5.error, '\n');
    }

    // Test 6: Subscription Cancelled
    console.log('6️⃣  Testing Subscription Cancelled...');
    const result6 = await emailService.sendSubscriptionCancelled({
      to: testEmail,
      username: 'Test User',
      planName: 'Pro',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });

    if (result6.success) {
      console.log('✅ Subscription Cancelled sent\n');
    } else {
      console.error('❌ Failed:', result6.error, '\n');
    }

    console.log('✅ All test emails sent successfully!');
    console.log('\nNext steps:');
    console.log('  1. Check your inbox for 6 test emails');
    console.log('  2. Verify templates render correctly');
    console.log('  3. Test email links and buttons');

    if (!process.env.RESEND_API_KEY) {
      console.log('  4. View emails in Mailhog: http://localhost:8025\n');
    } else {
      console.log('  4. Check Resend dashboard for delivery status\n');
    }

  } catch (error) {
    console.error('❌ Error testing emails:', error);
    process.exit(1);
  }
}

testEmails();
