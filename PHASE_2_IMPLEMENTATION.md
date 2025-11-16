# Phase 2 Implementation Guide

This document outlines the Phase 2 high-priority features and developer experience enhancements that have been implemented.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Email Notification System](#email-notification-system)
3. [Webhook Retry Mechanism](#webhook-retry-mechanism)
4. [Error Boundaries & Loading States](#error-boundaries--loading-states)
5. [E2E Testing Suite](#e2e-testing-suite)
6. [Production Monitoring](#production-monitoring)
7. [Developer Experience Enhancements](#developer-experience-enhancements)
8. [Database Migrations](#database-migrations)
9. [Environment Variables](#environment-variables)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Overview

Phase 2 focuses on production-readiness and developer experience improvements:

### ✅ Implemented Features (All Complete!)

1. **Email Notification System** - Transactional emails for subscriptions, payments, and quota warnings
2. **Webhook Retry Mechanism** - Reliable webhook processing with exponential backoff
3. **Error Boundaries** - Graceful error handling with recovery options
4. **Enhanced Loading States** - Consistent loading skeletons across the app
5. **E2E Testing Suite** - Playwright tests for critical user flows
6. **Production Monitoring** - Error tracking with Sentry integration
7. **Docker Compose** - One-command local development environment
8. **Environment Validation** - Type-safe environment variable validation
9. **VS Code Configuration** - Optimized editor settings and snippets
10. **Health Check Endpoint** - Application monitoring and uptime checks

### 🎉 All Phase 2 Features Complete!

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

## E2E Testing Suite

### Overview

Comprehensive end-to-end testing with Playwright covering critical user flows.

### Features

- ✅ Multi-browser testing (Chrome, Firefox, Safari, Mobile)
- ✅ Automated test runner with CI/CD support
- ✅ Visual debugging with trace viewer
- ✅ Screenshots and videos on failure
- ✅ Parallel test execution
- ✅ Test reporting (HTML & GitHub Actions)

### Test Suites

**Authentication Tests** (`e2e/auth.spec.ts`):
- Landing page display
- Login/signup navigation
- Form validation
- Invalid credentials handling
- Password reset flow
- Protected route redirection

**Dashboard Tests** (`e2e/dashboard.spec.ts`):
- Dashboard access control
- Navigation elements
- Billing & subscriptions pages
- AI chat interface
- Sidebar navigation

**Subscription Flow Tests** (`e2e/subscription-flow.spec.ts`):
- Plan comparison display
- Upgrade button functionality
- Feature lists
- Usage information
- Current plan display

**Admin Tests** (`e2e/admin.spec.ts`):
- Admin access control
- User management interface
- Audit log viewer
- Role-based permissions

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e auth.spec.ts

# Run specific test
pnpm test:e2e auth.spec.ts -g "should display landing page"
```

### Configuration

**File:** `playwright.config.ts`

Key settings:
- Base URL: `http://localhost:3000` (configurable via env)
- Retries: 2 on CI, 0 locally
- Reporters: HTML + GitHub Actions
- Screenshot on failure
- Video on failure
- Trace on first retry

### CI/CD Integration

Tests automatically run in GitHub Actions with:
- Parallel execution across browsers
- Artifact upload (screenshots, videos, traces)
- HTML report generation
- Test result annotations

### Files Created

```
e2e/
├── auth.spec.ts              -- Authentication flows
├── dashboard.spec.ts         -- Dashboard functionality
├── subscription-flow.spec.ts -- Subscription management
└── admin.spec.ts             -- Admin panel

playwright.config.ts          -- Playwright configuration
```

### Best Practices

1. **Run tests locally before committing**
   ```bash
   pnpm test:e2e
   ```

2. **Use UI mode for development**
   ```bash
   pnpm test:e2e:ui
   ```

3. **Check test reports after failures**
   ```bash
   npx playwright show-report
   ```

4. **Update snapshots when UI changes**
   ```bash
   pnpm test:e2e --update-snapshots
   ```

---

## Production Monitoring

### Overview

Production-ready error tracking and performance monitoring with Sentry integration.

### Features

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ Edge runtime error tracking
- ✅ Performance monitoring
- ✅ User context tracking
- ✅ Breadcrumb trail
- ✅ Health check endpoint
- ✅ Custom error reporting

### Monitoring Library

**File:** `src/lib/monitoring.ts`

Centralized monitoring utilities:

```typescript
import { monitoring } from '@/lib/monitoring';

// Initialize monitoring (in app layout)
monitoring.init();

// Capture exceptions
try {
  // risky operation
} catch (error) {
  monitoring.captureException(error, {
    user: { id: userId },
    tags: { feature: 'payment' },
    extra: { transactionId: txId }
  });
}

// Capture messages
monitoring.captureMessage('Payment completed', {
  user: { id: userId },
  tags: { plan: 'pro' },
  level: 'info'
});

// Set user context
monitoring.setUser({
  id: user.id,
  email: user.email,
  username: user.name
});

// Add breadcrumbs
monitoring.addBreadcrumb('User clicked checkout', 'user-action');

// Performance tracking
const transaction = monitoring.startTransaction('checkout-flow');
try {
  await processPayment();
} finally {
  transaction.finish();
}
```

### Sentry Configuration

Three configuration files for different runtimes:

**Client-side:** `sentry.client.config.ts`
- Browser error tracking
- Session replay (10% sampling)
- Error replay (100% sampling)
- Performance monitoring (10% sampling)

**Server-side:** `sentry.server.config.ts`
- API error tracking
- SSR error tracking
- Performance monitoring

**Edge runtime:** `sentry.edge.config.ts`
- Middleware error tracking
- Edge API error tracking

### Health Check Endpoint

**Endpoint:** `GET /api/health`

Basic health check:
```bash
curl http://localhost:3000/api/health
# Response: { status: 'ok', timestamp: '...' }
```

Detailed health check:
```bash
curl http://localhost:3000/api/health?detailed=true
# Response: { status: 'ok', checks: {...}, timestamp: '...' }
```

Health checks include:
- Database connectivity
- Environment variable validation
- Service status

### Setup Instructions

1. **Install Sentry** (optional, for production):
   ```bash
   pnpm install @sentry/nextjs
   ```

2. **Get Sentry DSN**:
   - Sign up at https://sentry.io
   - Create a new Next.js project
   - Copy your DSN

3. **Configure environment variables**:
   ```env
   # Server-side
   SENTRY_DSN=https://...@sentry.io/...

   # Client-side (public)
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

4. **Uncomment Sentry initialization**:
   - Edit `sentry.client.config.ts`
   - Edit `sentry.server.config.ts`
   - Edit `sentry.edge.config.ts`
   - Uncomment the `Sentry.init()` blocks

5. **Test error tracking**:
   ```typescript
   import { monitoring } from '@/lib/monitoring';

   monitoring.captureException(new Error('Test error'));
   ```

### Error Filtering

Configured to ignore common errors:
- ResizeObserver loop limit exceeded
- Non-Error promise rejections
- Health check endpoint traffic

### Files Created

```
src/
├── lib/
│   └── monitoring.ts            -- Monitoring utilities
├── app/
│   └── api/
│       └── health/
│           └── route.ts         -- Health check endpoint

sentry.client.config.ts          -- Client Sentry config
sentry.server.config.ts          -- Server Sentry config
sentry.edge.config.ts            -- Edge Sentry config
```

### Monitoring in Production

1. **Error Tracking**:
   - Automatic capture of unhandled errors
   - Stack traces with source maps
   - User context (if logged in)
   - Breadcrumb trail

2. **Performance Monitoring**:
   - API response times
   - Database query performance
   - Frontend render performance
   - Transaction traces

3. **Alerts**:
   - Configure in Sentry dashboard
   - Email/Slack/PagerDuty integrations
   - Custom alert rules

4. **Health Monitoring**:
   - Add health check URL to uptime monitoring
   - Use `/api/health?detailed=true` for diagnostics
   - Configure load balancer health checks

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
**Version:** Phase 2.0 - COMPLETE
**Status:** ✅ All Phase 2 Features Complete - Production Ready!
