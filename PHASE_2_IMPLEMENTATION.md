# Phase 2 Implementation Guide

This document outlines the Phase 2 high-priority features and developer experience enhancements that have been implemented.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Email Notification System](#email-notification-system)
3. [Webhook Retry Mechanism](#webhook-retry-mechanism)
4. [Error Boundaries & Loading States](#error-boundaries--loading-states)
5. [Developer Experience Enhancements](#developer-experience-enhancements)
6. [Database Migrations](#database-migrations)
7. [Environment Variables](#environment-variables)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

Phase 2 focuses on production-readiness and developer experience improvements:

### ✅ Implemented Features

1. **Email Notification System** - Transactional emails for subscriptions, payments, and quota warnings
2. **Webhook Retry Mechanism** - Reliable webhook processing with exponential backoff
3. **Error Boundaries** - Graceful error handling with recovery options
4. **Enhanced Loading States** - Consistent loading skeletons across the app
5. **Docker Compose** - One-command local development environment
6. **Environment Validation** - Type-safe environment variable validation
7. **VS Code Configuration** - Optimized editor settings and snippets

### ⏳ Pending Features

1. **E2E Testing Suite** - Playwright tests for critical flows
2. **Production Monitoring** - Error tracking and performance monitoring

---

## Email Notification System

### Overview

Comprehensive email notification system using Resend and React Email components.

### Email Templates

Five transactional email templates have been created:

1. **Subscription Confirmation** (`subscription-confirmation.tsx`)
   - Sent when user subscribes to a plan
   - Includes plan details, billing cycle, next billing date

2. **Payment Success** (`payment-success.tsx`)
   - Sent after successful payment
   - Includes receipt information and invoice download link

3. **Payment Failure** (`payment-failure.tsx`)
   - Sent when payment fails
   - Includes failure reason and action items

4. **Quota Warning** (`quota-warning.tsx`)
   - Sent at 80%, 90%, and 100% quota usage
   - Includes usage details and upgrade options

5. **Subscription Cancelled** (`subscription-cancelled.tsx`)
   - Sent when subscription is cancelled
   - Includes end date and reactivation option

### Files Created

```
src/
├── components/
│   └── emails/
│       ├── subscription-confirmation.tsx
│       ├── payment-success.tsx
│       ├── payment-failure.tsx
│       ├── quota-warning.tsx
│       └── subscription-cancelled.tsx
└── lib/
    └── email-service.ts
```

### Integration Points

**Webhook Handler** (`src/app/api/webhooks/polar/route.ts`):
- Subscription created → Sends confirmation email
- Subscription updated → Sends payment success email
- Subscription cancelled → Sends cancellation email

**Usage Tracker** (`src/lib/usage-tracker.ts`):
- 80% quota → Sends warning email
- 90% quota → Sends warning email
- 100% quota → Sends limit reached email

### Usage Examples

```typescript
import { emailService } from '@/lib/email-service';

// Send subscription confirmation
await emailService.sendSubscriptionConfirmation({
  to: user.email,
  username: user.name,
  planName: 'Pro',
  billingCycle: 'Monthly',
  nextBillingDate: '2025-12-16',
  amount: '$29/month',
});

// Send quota warning
await emailService.sendQuotaWarning({
  to: user.email,
  username: user.name,
  planName: 'Free',
  usagePercentage: 80,
  quotaUsed: 8,
  quotaLimit: 10,
  resetDate: '2025-12-01',
});
```

### Testing Emails

Use Mailhog for local email testing:

```bash
# Start Mailhog with Docker Compose
docker-compose up mailhog

# View emails at http://localhost:8025
# SMTP server running on localhost:1025
```

Update `.env.local` for local email testing:

```env
RESEND_API_KEY=re_123... # Or leave empty for Mailhog
```

---

## Webhook Retry Mechanism

### Overview

Reliable webhook processing with automatic retry and dead letter queue.

### Features

- ✅ Persistent webhook event storage
- ✅ Automatic retry with exponential backoff (1s, 2s, 4s)
- ✅ Maximum 3 retry attempts
- ✅ Dead letter queue for failed events
- ✅ Event status tracking (pending, processing, success, failed)
- ✅ Manual retry capability
- ✅ Webhook statistics and monitoring

### Database Schema

New `webhook_event` table added to track all webhook events:

```sql
CREATE TABLE webhook_event (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,          -- 'polar', 'stripe', etc.
  event_type TEXT NOT NULL,      -- Event type from payload
  payload TEXT NOT NULL,          -- Full JSON payload
  status TEXT NOT NULL,           -- 'pending', 'processing', 'success', 'failed'
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Files Created

```
src/
├── lib/
│   └── webhook-processor.ts     -- Webhook retry logic
└── db/
    └── schema.ts                 -- Updated with webhookEvent table
```

### Usage Examples

```typescript
import { processWebhookNow } from '@/lib/webhook-processor';

// Process webhook with automatic retry
const result = await processWebhookNow(
  'polar',
  'subscription.created',
  webhookPayload,
  async (payload) => {
    // Your webhook processing logic
    await handleSubscriptionCreated(payload);
  }
);

console.log(result); // { eventId: '...', success: true }
```

### Integration

To integrate webhook retry into existing webhook handlers:

```typescript
// Before (old webhook handler)
export async function POST(req: NextRequest) {
  const payload = await req.json();
  await handleWebhook(payload);
  return NextResponse.json({ ok: true });
}

// After (with retry mechanism)
import { processWebhookNow } from '@/lib/webhook-processor';

export async function POST(req: NextRequest) {
  const payload = await req.json();

  const result = await processWebhookNow(
    'polar',
    payload.type,
    payload,
    async (data) => await handleWebhook(data)
  );

  return NextResponse.json({ ok: result.success, eventId: result.eventId });
}
```

### Monitoring

Get webhook statistics:

```typescript
import { getWebhookStats } from '@/lib/webhook-processor';

const stats = await getWebhookStats();
console.log(stats);
// {
//   total: 150,
//   pending: 2,
//   processing: 1,
//   success: 145,
//   failed: 2
// }
```

---

## Error Boundaries & Loading States

### Overview

Graceful error handling and consistent loading states for better UX.

### Error Boundaries

Three levels of error boundaries:

1. **ErrorBoundary** - General purpose error boundary
2. **PageErrorBoundary** - Full-page error handling
3. **SectionErrorBoundary** - Section-level error handling

### Usage Examples

```tsx
// Wrap entire page
import { PageErrorBoundary } from '@/components/error-boundary';

export default function MyPage() {
  return (
    <PageErrorBoundary>
      <YourContent />
    </PageErrorBoundary>
  );
}

// Wrap a section
import { SectionErrorBoundary } from '@/components/error-boundary';

export function DashboardStats() {
  return (
    <SectionErrorBoundary title="Dashboard Statistics">
      <StatsWidget />
    </SectionErrorBoundary>
  );
}

// Custom error boundary
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    console.error(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Loading States

Consistent loading skeletons for various components:

```tsx
import {
  PageLoader,
  ButtonLoader,
  TableLoader,
  CardLoader,
  DashboardLoader,
  FormLoader,
  ChatLoader,
  InlineLoader,
} from '@/components/loading-states';

// Full page loading
<PageLoader />

// Button loading
<Button disabled>
  <ButtonLoader text="Saving..." />
</Button>

// Table loading
<TableLoader rows={5} columns={4} />

// Dashboard loading
<DashboardLoader />
```

### Files Created

```
src/
└── components/
    ├── error-boundary.tsx
    └── loading-states.tsx
```

---

## Developer Experience Enhancements

### Docker Compose

One-command local development environment with PostgreSQL, Redis, and Mailhog.

**Start development environment:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
```

**Services:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mailhog SMTP: `localhost:1025`
- Mailhog Web UI: `http://localhost:8025`

**Environment variables for local development:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_saas_dev
```

### Environment Variable Validation

Type-safe environment variable validation with helpful error messages.

**Files:**
- `src/lib/validate-env.ts`

**Usage:**

```typescript
import { validateEnv, isProductionReady } from '@/lib/validate-env';

// Validate all environment variables
const env = validateEnv();

// Check production readiness
if (process.env.NODE_ENV === 'production' && !isProductionReady()) {
  throw new Error('Production environment not ready');
}

// Use validated env
const dbUrl = env.DATABASE_URL;
```

**Benefits:**
- ✅ Catch missing env vars at startup
- ✅ Type-safe environment variables
- ✅ Helpful error messages with setup instructions
- ✅ Production readiness check

### VS Code Configuration

Optimized editor settings, extensions, launch configurations, and code snippets.

**Files Created:**
```
.vscode/
├── settings.json       -- Editor settings
├── extensions.json     -- Recommended extensions
├── launch.json         -- Debug configurations
└── snippets.code-snippets  -- Custom code snippets
```

**Code Snippets:**

Type these prefixes and press Tab:

- `api-route` - Create authenticated API route
- `server-component` - Create server component
- `client-component` - Create client component
- `db-query` - Database query template
- `track-usage` - Usage tracking template
- `audit-log` - Audit log template
- `send-email` - Send email template
- `test-case` - Test case template

**Recommended Extensions:**
- Biome (formatter/linter)
- Tailwind CSS IntelliSense
- Error Lens
- Docker
- Thunder Client (API testing)

---

## Database Migrations

### Required Migrations

Three schema changes need to be applied:

#### 1. Usage Quota Warning Flags

```sql
ALTER TABLE usage_quota
ADD COLUMN warning_80_sent BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN warning_90_sent BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN warning_100_sent BOOLEAN DEFAULT FALSE NOT NULL;
```

#### 2. Webhook Event Table

```sql
CREATE TABLE webhook_event (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  last_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_webhook_status ON webhook_event(status, created_at);
```

### Apply Migrations

**Option 1: Using Drizzle Kit (Recommended)**

```bash
# Generate migration
pnpm db:push

# Or with migration files
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

**Option 2: Manual SQL**

Run the SQL statements above directly on your database.

**Verify Migrations:**

```bash
# Check database schema
pnpm db:studio

# Or connect to your database
psql $DATABASE_URL
\dt  # List tables
\d usage_quota  # Check usage_quota columns
\d webhook_event  # Check webhook_event table
```

---

## Environment Variables

### Required Variables

Update your `.env` or `.env.local` with:

```env
# Existing variables (already set)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
ENCRYPTION_KEY=...

# Email Service (Resend)
RESEND_API_KEY=re_...
RESEND_SENDER_EMAIL=noreply@yourdomain.com

# Payment Provider (Polar)
POLAR_ACCESS_TOKEN=polar_...
POLAR_WEBHOOK_SECRET=polar_wh_...

# Google OAuth (optional for dev)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Security (Arcjet)
ARCJET_KEY=...

# Node Environment
NODE_ENV=development
```

### Local Development

For local development with Docker Compose and Mailhog:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_saas_dev
RESEND_API_KEY=          # Leave empty to use Mailhog
NODE_ENV=development
```

---

## Testing

### Email Testing

**With Mailhog (Local):**

```bash
# Start Mailhog
docker-compose up mailhog

# Send test email
pnpm tsx scripts/test-email.ts

# View emails at http://localhost:8025
```

**With Resend (Production):**

```bash
# Set Resend API key
export RESEND_API_KEY=re_...

# Send test email
pnpm tsx scripts/test-email.ts
```

### Webhook Testing

**Test webhook processing:**

```typescript
import { processWebhookNow } from '@/lib/webhook-processor';

const result = await processWebhookNow(
  'polar',
  'subscription.created',
  { test: 'data' },
  async (payload) => {
    console.log('Processing:', payload);
  }
);

console.log('Result:', result);
```

**Manual retry:**

```typescript
import { retryWebhookEvent } from '@/lib/webhook-processor';

const result = await retryWebhookEvent('event_id', processor);
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] Run database migrations
- [ ] Set all required environment variables
- [ ] Verify email service (Resend) is configured
- [ ] Test webhook endpoints with payload samples
- [ ] Verify environment variable validation passes
- [ ] Run type checking: `pnpm type-check`
- [ ] Run tests: `pnpm test:run`
- [ ] Build application: `pnpm build`

### Database Migration Steps

**Vercel Postgres / Neon:**

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Apply migrations
pnpm db:push

# 3. Verify
pnpm db:studio
```

### Environment Variables

Set in Vercel dashboard or deployment platform:

1. Go to Project Settings → Environment Variables
2. Add all required variables from [Environment Variables](#environment-variables) section
3. Redeploy application

### Post-Deployment Verification

1. **Email Notifications:**
   - Subscribe to a test plan
   - Verify confirmation email received
   - Cancel subscription
   - Verify cancellation email received

2. **Webhook Processing:**
   - Trigger test webhook from Polar dashboard
   - Check webhook event logs in database
   - Verify webhook_event table populated

3. **Quota Warnings:**
   - Use test account to reach 80% quota
   - Verify warning email received
   - Check usageQuota table for warning flags

---

## Troubleshooting

### Email Issues

**Emails not sending:**
- Verify `RESEND_API_KEY` is set
- Check `RESEND_SENDER_EMAIL` is verified domain
- Check Resend dashboard for delivery logs

**Local email testing:**
- Use Mailhog: `docker-compose up mailhog`
- View emails at `http://localhost:8025`

### Webhook Issues

**Webhooks failing:**
- Check webhook_event table for error messages
- Verify webhook signature verification
- Check retry_count - max is 3 attempts

**Manual retry:**
```typescript
import { retryWebhookEvent } from '@/lib/webhook-processor';
await retryWebhookEvent('event_id', processor);
```

### Database Issues

**Migration failures:**
- Ensure DATABASE_URL is correct
- Check database permissions
- Verify no existing conflicting columns

**Schema verification:**
```bash
pnpm db:studio
# Or
psql $DATABASE_URL -c "\d usage_quota"
```

---

## Next Steps

### Remaining Phase 2 Features

1. **E2E Testing Suite** - Playwright tests for critical user flows
2. **Production Monitoring** - Sentry integration for error tracking

### Phase 3 Features (Optional)

1. Multi-tenancy/team workspaces
2. Advanced analytics dashboard
3. Granular permission system
4. Two-factor authentication (2FA)
5. API documentation with Swagger

---

## Support

For issues or questions:

1. Check this implementation guide
2. Review error messages in logs
3. Check database schema with `pnpm db:studio`
4. Review code comments in new files
5. Create an issue in the repository

---

**Last Updated:** 2025-11-16
**Version:** Phase 2.0
**Status:** ✅ High Priority Features Complete
