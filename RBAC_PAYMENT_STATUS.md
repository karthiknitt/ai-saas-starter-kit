# RBAC & Payment Implementation Status

**Last Updated:** 2025-10-30
**Project:** AI+SaaS Starter Kit
**Version:** 0.1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [RBAC Status](#rbac-status)
3. [Payment Integration Status](#payment-integration-status)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Key File Reference](#key-file-reference)
6. [Technical Specifications](#technical-specifications)

---

## Project Overview

### Tech Stack
- **Frontend**: Next.js 15.5.4, React 19.2.0, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Better Auth 1.3.26
- **Database**: PostgreSQL (Neon), Drizzle ORM 0.44.6
- **AI**: Vercel AI SDK, OpenAI, OpenRouter
- **Security**: Arcjet (rate limiting), encrypted API keys
- **Testing**: Vitest, 163+ test cases

### Project Statistics
- ~5,023 lines of TypeScript/TSX code
- Two-role RBAC system (member, admin)
- Email/password + Google OAuth authentication
- AI chat with streaming responses

---

## RBAC Status

### ✅ Completed Features

#### Core RBAC Implementation
- [x] Two-role system (member, admin) defined in `src/db/schema.ts:16`
- [x] Better Auth integration with role field
- [x] Role field in database (enum type, indexed, NOT NULL, default 'member')
- [x] Server-side role verification in all critical paths
- [x] Role cannot be self-assigned during registration

#### Access Control
- [x] Middleware authentication checks (`middleware.ts:12-37`)
- [x] Server-side role verification in admin pages
- [x] Reusable `requireAdmin()` guard function (`src/app/api/admin/users/route.ts:9-17`)
- [x] Proper HTTP status codes (401 unauthorized, 403 forbidden)
- [x] Redirect non-admin users to home page

#### Admin Features
- [x] Admin dashboard page (`src/app/admin/page.tsx`)
- [x] User management interface with pagination (`src/app/admin/users/page.tsx`)
- [x] Real-time role updates via API
- [x] Role badges with color coding (purple=admin, gray=member)
- [x] CLI admin promotion script (`scripts/make-admin.ts`)
- [x] Admin navigation in sidebar and header (conditional rendering)

#### Testing
- [x] Admin page access tests (auth, role checks, DB fallback)
- [x] Admin API tests (GET, PATCH, authorization)
- [x] Middleware tests (session checks, admin routes, security headers)
- [x] Database schema tests (role field verification)

#### Security
- [x] Session-based authentication with secure cookies
- [x] Secure role assignment (server-side only)
- [x] Rate limiting with Arcjet
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] API key encryption for user credentials
- [x] SQL injection protection via Drizzle ORM

### ⚠️ Pending RBAC Features

#### 1. Granular Permissions System
**Priority:** Medium
**Status:** NOT IMPLEMENTED

**Current State:**
- Binary role system only (admin/member)
- No fine-grained permissions

**Required Implementation:**
```typescript
// src/db/schema.ts - Add permissions table
export const permission = pgTable('permission', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(), // e.g., 'users', 'posts', 'settings'
  action: text('action').notNull(),     // e.g., 'read', 'write', 'delete'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Role-Permission junction table
export const rolePermission = pgTable('role_permission', {
  roleId: text('role_id').references(() => role.id),
  permissionId: text('permission_id').references(() => permission.id),
}, table => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));
```

**Files to Create:**
- `src/lib/permissions.ts` - Permission checking utilities
- `src/hooks/use-permission.ts` - React hook for permission checks
- `src/app/api/admin/permissions/route.ts` - Permission management API

**Estimated Effort:** 2-3 days

#### 2. Audit Logging
**Priority:** High
**Status:** BASIC LOGGING ONLY

**Current State:**
- General API request logging exists
- No specific RBAC audit trail

**Required Implementation:**
```typescript
// src/db/schema.ts - Add audit log table
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  action: text('action').notNull(),       // e.g., 'role_changed', 'user_deleted'
  resourceType: text('resource_type'),    // e.g., 'user', 'role'
  resourceId: text('resource_id'),
  changes: jsonb('changes'),              // Before/after state
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, table => ({
  idxUserId: index('idx_audit_user_id').on(table.userId),
  idxTimestamp: index('idx_audit_timestamp').on(table.timestamp),
  idxAction: index('idx_audit_action').on(table.action),
}));
```

**Files to Create:**
- `src/lib/audit-logger.ts` - Audit logging utility
- `src/app/admin/audit-logs/page.tsx` - Audit log viewer UI
- `src/app/api/admin/audit-logs/route.ts` - Audit log API

**Integration Points:**
- `src/app/api/admin/users/route.ts:40-54` - Log role changes
- All admin actions should trigger audit logs

**Estimated Effort:** 2-3 days

#### 3. Enhanced Role System
**Priority:** Medium
**Status:** NOT IMPLEMENTED

**Current State:**
- Only 2 roles (member, admin)
- No role hierarchy or custom roles

**Required Implementation:**
```typescript
// src/db/schema.ts - Expand role system
export const userRole = pgEnum('user_role', [
  'member',      // Default user
  'admin',       // Full admin access
  'moderator',   // Content moderation
  'editor',      // Content editing
  'viewer',      // Read-only access
]);

// Or move to a roles table for dynamic roles
export const role = pgTable('role', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  level: integer('level').notNull(),  // For hierarchy (higher = more privileges)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Files to Modify:**
- `src/db/schema.ts:16` - Expand role enum or create roles table
- `src/components/users-client.tsx:31-50` - Update role selection UI
- `src/lib/auth.ts:49-54` - Update role field configuration

**Estimated Effort:** 1-2 days

#### 4. Permission Guard Utilities
**Priority:** Medium
**Status:** NOT IMPLEMENTED

**Required Implementation:**
```typescript
// src/lib/permission-guards.ts
export async function requirePermission(
  permission: string,
  session?: TypedSession | null
): Promise<{ ok: true; session: TypedSession } | { ok: false; code: 401 | 403 }> {
  if (!session) {
    session = await auth.api.getSession({ headers: await headers() }) as TypedSession | null;
  }

  if (!session) return { ok: false, code: 401 };

  const hasPermission = await checkUserPermission(session.user.id, permission);
  if (!hasPermission) return { ok: false, code: 403 };

  return { ok: true, session };
}

// src/hooks/use-has-permission.ts
export function useHasPermission(permission: string): boolean {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Fetch user permissions and check
  }, [permission]);

  return hasPermission;
}

// src/components/protected.tsx
export function Protected({
  permission,
  fallback,
  children
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const hasPermission = useHasPermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
```

**Usage Example:**
```typescript
// In API routes
const gate = await requirePermission('users:write');
if (!gate.ok) return NextResponse.json({ error: 'Forbidden' }, { status: gate.code });

// In components
<Protected permission="admin:access" fallback={<div>Access denied</div>}>
  <AdminPanel />
</Protected>
```

**Estimated Effort:** 1-2 days

#### 5. Middleware Role-Based Protection
**Priority:** Low
**Status:** AUTHENTICATION ONLY

**Current State:**
- Middleware only checks session existence
- Role checks deferred to server-side logic

**Potential Enhancement:**
```typescript
// middleware.ts - Add role-based route protection
const roleRoutes = {
  '/admin': ['admin'],
  '/moderator': ['admin', 'moderator'],
  '/editor': ['admin', 'editor'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires specific roles
  const requiredRoles = Object.entries(roleRoutes).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (requiredRoles) {
    const session = await getSession(request);
    if (!session) return NextResponse.redirect(new URL('/', request.url));

    if (!requiredRoles.includes(session.user.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
```

**Note:** Current pattern (role checks in pages) is secure and follows Next.js best practices. This enhancement is optional.

**Estimated Effort:** 1 day

### RBAC Testing Gaps

**Missing Tests:**
- [ ] Integration tests for UsersClient component
- [ ] E2E tests for full admin workflow (login → user management → role change)
- [ ] Tests for make-admin script
- [ ] Performance tests for role queries with large datasets
- [ ] Permission system tests (when implemented)
- [ ] Audit logging tests (when implemented)

**Estimated Effort:** 2-3 days

---

## Payment Integration Status

### ❌ Not Implemented

**Billing Provider:** Polar (commented out)
**Status:** Infrastructure ready but not configured

### Current State

#### Commented Out Code
**Location:** `src/lib/auth.ts:66-93`
```typescript
// plugins: [
//   polar({
//     name: "Polar plugin",
//     productSyncInterval: 60000,
//     includeProducts: ["monthly-subscription"],
//     organization: process.env.POLAR_ORGANIZATION_ID as string,
//     token: process.env.POLAR_ACCESS_TOKEN as string,
//   }),
// ],
```

#### Database Schema Ready
**Location:** `src/db/schema.ts:44-61`
```typescript
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  planName: text('plan_name'),
  status: text('status'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Incomplete Pages
**TODOs Found:**

1. **Subscriptions Page** (`src/app/dashboard/subscriptions/page.tsx:37`)
```typescript
// TODO: Implement checkout when polar is properly configured
```

2. **Billing Page** (`src/app/billing/page.tsx:89`)
```typescript
// TODO: Implement customer state fetching when polar is properly configured
```

### Required Implementation

#### 1. Polar Configuration
**Priority:** High
**Estimated Effort:** 2-3 days

**Steps:**
1. Create Polar account and organization
2. Set up products in Polar dashboard
3. Add environment variables:
   ```env
   POLAR_ORGANIZATION_ID=your_org_id
   POLAR_ACCESS_TOKEN=your_access_token
   ```
4. Uncomment Polar plugin in `src/lib/auth.ts:66-93`
5. Test product sync

#### 2. Subscription Management
**Priority:** High
**Estimated Effort:** 3-4 days

**Files to Modify:**

**`src/app/dashboard/subscriptions/page.tsx`**
```typescript
// Replace TODO with actual implementation
async function handleCheckout(productId: string) {
  const checkoutUrl = await createPolarCheckout({
    productId,
    userId: session.user.id,
    successUrl: `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_URL}/subscriptions?canceled=true`,
  });

  window.location.href = checkoutUrl;
}
```

**`src/app/billing/page.tsx`**
```typescript
// Replace TODO with actual implementation
const customerData = await fetchPolarCustomer(session.user.id);
const subscription = await db.query.subscription.findFirst({
  where: eq(subscriptionTable.userId, session.user.id),
});
```

**Files to Create:**
- `src/lib/polar-client.ts` - Polar API client
- `src/app/api/webhooks/polar/subscription-created/route.ts` - Handle new subscriptions
- `src/app/api/webhooks/polar/subscription-updated/route.ts` - Handle subscription updates
- `src/app/api/webhooks/polar/subscription-canceled/route.ts` - Handle cancellations

#### 3. Subscription-Based Features
**Priority:** High
**Estimated Effort:** 2-3 days

**Implementation Strategy:**
```typescript
// src/lib/subscription-features.ts
export const PLAN_FEATURES = {
  free: {
    aiRequests: 10,
    models: ['gpt-3.5-turbo'],
    apiKeys: 1,
  },
  pro: {
    aiRequests: 1000,
    models: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'],
    apiKeys: 5,
  },
  enterprise: {
    aiRequests: -1, // unlimited
    models: ['*'], // all models
    apiKeys: -1, // unlimited
  },
};

export async function checkFeatureAccess(
  userId: string,
  feature: keyof typeof PLAN_FEATURES.free
): Promise<boolean> {
  const subscription = await db.query.subscription.findFirst({
    where: eq(subscriptionTable.userId, userId),
  });

  const plan = subscription?.planName || 'free';
  const features = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES];

  // Check feature limits
  return true; // or false
}
```

**Integration Points:**
- `src/app/api/chat/route.ts` - Check AI request limits
- `src/app/api/user/api-keys/route.ts` - Check API key limits
- `src/app/api/models/route.ts` - Filter models by plan

#### 4. Webhook Handler
**Priority:** High
**Estimated Effort:** 1-2 days

**Files to Create:**
```typescript
// src/app/api/webhooks/polar/route.ts
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { subscription as subscriptionTable } from '@/db/schema';

export async function POST(request: Request) {
  const body = await request.json();
  const signature = (await headers()).get('polar-signature');

  // Verify webhook signature
  const isValid = verifyPolarSignature(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle different event types
  switch (body.type) {
    case 'subscription.created':
      await handleSubscriptionCreated(body.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(body.data);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(body.data);
      break;
  }

  return NextResponse.json({ received: true });
}
```

#### 5. Billing Dashboard
**Priority:** Medium
**Estimated Effort:** 2-3 days

**Features to Implement:**
- Current subscription display
- Usage metrics (AI requests, API keys)
- Plan upgrade/downgrade UI
- Payment method management
- Invoice history

**Files to Modify:**
- `src/app/billing/page.tsx` - Complete billing dashboard
- `src/components/subscription-card.tsx` - Create subscription display component
- `src/components/usage-metrics.tsx` - Create usage display component

### Payment Testing Requirements

**Required Tests:**
- [ ] Polar webhook signature verification
- [ ] Subscription creation flow
- [ ] Subscription update handling
- [ ] Subscription cancellation handling
- [ ] Feature access checks based on plan
- [ ] Usage limit enforcement
- [ ] Upgrade/downgrade flows
- [ ] Payment failure handling

**Estimated Effort:** 2-3 days

---

## Implementation Roadmap

### Phase 1: Critical Payment Features (1-2 weeks)
**Goal:** Get billing working for MVP

1. **Configure Polar** (2-3 days)
   - Set up Polar account and products
   - Configure environment variables
   - Uncomment and test Polar plugin

2. **Implement Checkout Flow** (2-3 days)
   - Complete `src/app/dashboard/subscriptions/page.tsx`
   - Create checkout API endpoint
   - Test payment flow end-to-end

3. **Webhook Handler** (1-2 days)
   - Implement webhook signature verification
   - Handle subscription events
   - Update database on subscription changes

4. **Basic Subscription Features** (2-3 days)
   - Implement feature access checks
   - Add usage limits to AI chat
   - Display subscription status in dashboard

**Deliverables:**
- ✅ Working checkout flow
- ✅ Webhook processing
- ✅ Basic subscription-based feature gating
- ✅ Subscription status display

### Phase 2: Enhanced RBAC (1-2 weeks)
**Goal:** Production-ready RBAC with audit logging

1. **Audit Logging** (2-3 days)
   - Create audit log database schema
   - Implement audit logging utility
   - Add audit logs to all admin actions
   - Create audit log viewer UI

2. **Enhanced Role System** (1-2 days)
   - Expand role enum or create roles table
   - Update admin UI for new roles
   - Add role hierarchy if needed

3. **Permission Guards** (1-2 days)
   - Create permission checking utilities
   - Implement React hooks for permissions
   - Add `<Protected>` component

**Deliverables:**
- ✅ Comprehensive audit logging
- ✅ Expanded role system
- ✅ Reusable permission utilities
- ✅ Audit log viewer for admins

### Phase 3: Advanced Features (1-2 weeks)
**Goal:** Production polish and advanced capabilities

1. **Granular Permissions** (2-3 days)
   - Create permissions database schema
   - Build permission management UI
   - Integrate with existing role system

2. **Complete Billing Dashboard** (2-3 days)
   - Usage metrics display
   - Plan management UI
   - Invoice history
   - Payment method management

3. **Comprehensive Testing** (2-3 days)
   - E2E tests for admin workflows
   - Payment flow tests
   - Permission system tests
   - Performance tests

4. **Documentation** (1 day)
   - API documentation (OpenAPI)
   - RBAC usage guide
   - Deployment guide
   - Developer onboarding docs

**Deliverables:**
- ✅ Full-featured permissions system
- ✅ Complete billing dashboard
- ✅ Comprehensive test coverage
- ✅ Production documentation

### Total Estimated Timeline: 3-6 weeks
- **Phase 1 (Critical):** 1-2 weeks
- **Phase 2 (Important):** 1-2 weeks
- **Phase 3 (Polish):** 1-2 weeks

---

## Key File Reference

### RBAC Files

#### Core Authentication
```
src/lib/auth.ts                    # Better Auth configuration
src/lib/auth-client.ts             # Client-side auth
src/lib/auth-types.d.ts            # Type definitions
src/app/api/auth/[...all]/route.ts # Auth API handler
```

#### Database Schema
```
src/db/schema.ts                   # User table, role enum (line 16)
src/db/drizzle.ts                  # Drizzle config
migrations/                        # Database migrations
```

#### Access Control
```
middleware.ts                      # Session-based route protection (lines 12-37)
src/app/admin/page.tsx             # Admin dashboard (lines 8-31)
src/app/admin/users/page.tsx       # User management with pagination
src/app/api/admin/users/route.ts   # Admin API with requireAdmin guard (lines 9-17)
```

#### UI Components
```
src/components/users-client.tsx    # User management interface (lines 31-50)
src/components/app-sidebar.tsx     # Sidebar with admin link (lines 178-214)
src/components/site-header.tsx     # Header with admin link (lines 29-67)
```

#### Scripts & Tools
```
scripts/make-admin.ts              # CLI admin promotion tool
```

#### Tests
```
unit-tests/integration/admin-page.test.ts      # Admin page tests (74 lines)
unit-tests/integration/api-admin-users.test.ts # Admin API tests (80 lines)
unit-tests/middleware.test.ts                  # Middleware tests (326 lines)
unit-tests/db/schema.test.ts                   # Schema tests (144 lines)
```

### Payment Files

#### Configuration
```
src/lib/auth.ts:66-93              # Polar plugin (commented out)
```

#### Database Schema
```
src/db/schema.ts:44-61             # Subscription table
```

#### Pages (Incomplete)
```
src/app/dashboard/subscriptions/page.tsx:37  # TODO: Implement checkout
src/app/billing/page.tsx:89                  # TODO: Implement customer state
```

#### Webhooks
```
src/app/api/webhooks/polar/route.ts  # Webhook handler (needs implementation)
```

### Files to Create

#### RBAC
```
src/lib/permissions.ts             # Permission checking utilities
src/lib/audit-logger.ts            # Audit logging utility
src/hooks/use-permission.ts        # Permission React hook
src/components/protected.tsx       # Permission-based component wrapper
src/app/admin/audit-logs/page.tsx  # Audit log viewer
src/app/api/admin/audit-logs/route.ts      # Audit log API
src/app/api/admin/permissions/route.ts     # Permission management API
```

#### Payments
```
src/lib/polar-client.ts            # Polar API client
src/lib/subscription-features.ts   # Feature access logic
src/components/subscription-card.tsx        # Subscription display
src/components/usage-metrics.tsx            # Usage display
src/app/api/webhooks/polar/subscription-created/route.ts
src/app/api/webhooks/polar/subscription-updated/route.ts
src/app/api/webhooks/polar/subscription-canceled/route.ts
```

---

## Technical Specifications

### Database Schema Changes

#### Audit Log Table (Phase 2)
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_action ON audit_log(action);
```

#### Permission Tables (Phase 3)
```sql
CREATE TYPE permission_action AS ENUM ('read', 'write', 'delete', 'admin');

CREATE TABLE permission (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action permission_action NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE role_permission (
  role TEXT NOT NULL,
  permission_id TEXT REFERENCES permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);
```

### Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (Resend)
RESEND_API_KEY=...

# Polar Payments (TO BE CONFIGURED)
POLAR_ORGANIZATION_ID=your_org_id
POLAR_ACCESS_TOKEN=your_access_token

# OpenAI
OPENAI_API_KEY=...

# Security
ARCJET_KEY=...
ENCRYPTION_KEY=... # For API key encryption
```

### API Endpoints Summary

#### Existing (Working)
```
POST /api/auth/sign-up              # User registration
POST /api/auth/sign-in/email        # Email/password login
POST /api/auth/sign-in/google       # Google OAuth
GET  /api/auth/session              # Get current session
POST /api/auth/sign-out             # Logout

GET  /api/admin/users               # List all users (admin only)
PATCH /api/admin/users              # Update user role (admin only)

POST /api/chat                      # AI chat (authenticated)
GET  /api/models                    # List AI models (authenticated)
GET  /api/user/api-keys             # Get user's API keys
POST /api/user/api-keys             # Create API key
DELETE /api/user/api-keys           # Delete API key
```

#### To Be Implemented
```
# Audit Logs
GET  /api/admin/audit-logs          # List audit logs (admin only)
GET  /api/admin/audit-logs/:id      # Get audit log details

# Permissions
GET  /api/admin/permissions         # List all permissions
POST /api/admin/permissions         # Create permission
PUT  /api/admin/permissions/:id     # Update permission
DELETE /api/admin/permissions/:id   # Delete permission

# Billing
POST /api/billing/checkout          # Create checkout session
GET  /api/billing/customer          # Get customer details
POST /api/billing/cancel            # Cancel subscription
POST /api/billing/upgrade           # Upgrade plan
POST /api/webhooks/polar            # Handle Polar webhooks

# Usage Tracking
GET  /api/user/usage                # Get user usage metrics
```

### Security Checklist

#### Current Security Measures
- [x] Session-based authentication
- [x] Secure cookies (httpOnly, secure, sameSite)
- [x] Role stored server-side only
- [x] Encrypted API keys in database
- [x] Rate limiting on all API routes
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] SQL injection protection via ORM
- [x] Email verification required
- [x] Password reset with tokens

#### To Be Implemented
- [ ] Webhook signature verification
- [ ] Payment fraud detection
- [ ] Audit logging for all sensitive actions
- [ ] Session timeout and refresh
- [ ] API key rotation
- [ ] Two-factor authentication (2FA)
- [ ] IP-based rate limiting per user
- [ ] Failed login attempt tracking

---

## Architecture Patterns

### Current Design Principles
1. **Defense in Depth**: Multiple layers of security checks
2. **Server-Side Verification**: Never trust client for authorization
3. **Type Safety**: Strict TypeScript throughout
4. **Separation of Concerns**: Auth, authz, UI, API are separate
5. **Testing**: Comprehensive unit/integration tests

### Design Patterns Used
- **Guard Pattern**: `requireAdmin()` for API protection
- **Repository Pattern**: Drizzle ORM for database access
- **Hook Pattern**: React hooks for client-side state
- **Middleware Pattern**: Next.js middleware for route protection
- **Adapter Pattern**: Better Auth database adapter

### Code Style Guidelines
- Use async/await over promises
- Prefer server components over client components
- Keep API routes thin, move logic to utilities
- Use Zod for all input validation
- Write tests alongside implementation
- Document complex logic with comments
- Use meaningful variable names (no single letters except loops)

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] Checkout flow has 0% error rate
- [ ] Webhooks process within 5 seconds
- [ ] Subscription status updates in real-time
- [ ] 100% test coverage for payment flow

### Phase 2 Success Criteria
- [ ] All admin actions are audit logged
- [ ] Audit logs are searchable and filterable
- [ ] Role changes are logged with before/after state
- [ ] 95%+ test coverage for RBAC

### Phase 3 Success Criteria
- [ ] Permission checks execute in <50ms
- [ ] Complete API documentation published
- [ ] E2E tests cover all critical paths
- [ ] Production deployment successful

---

## Questions & Decisions

### Open Questions
1. **Billing**: Which Polar products should we create? (monthly, annual, lifetime?)
2. **Permissions**: Do we need resource-level permissions or just role-based?
3. **Multi-tenancy**: Do we need organization/team support in future?
4. **Usage Limits**: Should we hard-limit or soft-limit when users hit quotas?
5. **Trial Period**: Should free tier be time-limited or feature-limited?

### Design Decisions to Make
1. **Audit Log Retention**: How long to keep audit logs? (90 days? 1 year? Forever?)
2. **Role Hierarchy**: Do we need role inheritance or flat roles?
3. **Permission Naming**: Use colon notation (e.g., `users:write`) or dot notation?
4. **Subscription Handling**: What happens to user data when subscription expires?
5. **Webhook Failures**: How to handle and retry failed webhook processing?

---

## Notes

### Current Branch
- **Branch**: `feature/rbac`
- **Status**: Clean working directory
- **Recent Commits**: Admin page tests, session mocking, pagination support

### Known Issues
- None identified - RBAC core is working well
- Billing integration not configured (intentional, pending Polar setup)

### Performance Considerations
- Role checks are fast (single DB query or session read)
- Add caching for permission checks when implemented
- Consider Redis for session storage at scale
- Audit logs will grow - implement archiving strategy

### Deployment Considerations
- Set all environment variables before deploying
- Run migrations: `npm run db:migrate`
- Create first admin: `EMAIL=admin@example.com npm run make-admin`
- Configure Polar webhooks to point to production URL
- Test payment flow in Polar sandbox before going live
- Set up monitoring for webhook failures

---

## Resources

### Documentation Links
- Better Auth: https://www.better-auth.com/docs
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Polar: https://polar.sh/docs
- Next.js 15: https://nextjs.org/docs
- Vercel AI SDK: https://sdk.vercel.ai/docs

### Code Examples
- Reusable admin guard: `src/app/api/admin/users/route.ts:9-17`
- Role-based UI rendering: `src/components/app-sidebar.tsx:178-214`
- Server-side role check: `src/app/admin/page.tsx:8-31`
- API key encryption: `src/lib/crypto.ts`

---

**Document Maintenance:**
- Update this file after each phase completion
- Mark items as complete with [x] in checklists
- Add new open questions as they arise
- Document any architectural decisions made
- Keep file paths up to date if refactoring occurs
