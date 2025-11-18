# Comprehensive Unit Test Analysis and Plan

## Executive Summary

**Current Test Status:**
- ✅ 282 unit tests passing (92.2%)
- ❌ 24 unit tests failing (7.8%)
- 📊 26 unit test files
- 🎭 5 e2e test files (Playwright)

**Test Coverage Status:**
- **Well Covered**: Core utilities, rate limiting, crypto, authentication, database operations
- **Partially Covered**: API routes, middleware, schema validation
- **Missing**: Workspace management, invitations, permissions, usage tracking, webhooks, billing, email service

---

## Part 1: Current Test Suite Analysis

### ✅ **Passing Tests (19 test files, 282 tests)**

#### 1. **Library/Utilities** (Well Covered)
- `lib/crypto.test.ts` - AES-256-GCM encryption/decryption ✅
- `lib/rate-limit.test.ts` - Rate limiting with multiple scenarios ✅
- `lib/utils.test.ts` - Tailwind CSS class merging ✅
- `lib/plan-map.test.ts` - Subscription plan mapping ✅
- `lib/logger.test.ts` - Winston logger configuration ✅
- `lib/arcjet.test.ts` - Arcjet security protection ✅
- `lib/auth-client.test.ts` - Auth client configuration ✅

#### 2. **Components** (Good Coverage)
- `components/theme-provider.test.tsx` - Theme switching ✅
- `components/performance-monitor.test.tsx` - Performance monitoring ✅
- `components/data-table.test.ts` - DataTable component ✅

#### 3. **Hooks** (Good Coverage)
- `hooks/use-mobile.test.ts` - Mobile detection hook ✅
- `hooks/use-performance.test.ts` - Performance metrics hook ✅

#### 4. **Integration Tests** (Partial Coverage)
- `integration/api-chat.test.ts` - Chat API endpoint ✅
- `integration/api-user-keys.test.ts` - User API keys endpoint ✅
- `integration/api-admin-users.test.ts` - Admin users endpoint ✅
- `integration/database-operations.test.ts` - CRUD operations ✅
- `integration/error-scenarios.test.ts` - Error handling ✅
- `integration/admin-page.test.ts` - Admin page behavior ✅
- `integration/components/login-form.test.tsx` - Login form ✅
- `integration/components/theme-provider.test.tsx` - Theme provider integration ✅

#### 5. **Performance Tests** (Excellent Coverage)
- `performance/data-table-performance.test.tsx` - Data table with 1K-10K rows ✅
- `performance/general-performance.test.ts` - Component render performance ✅

### ❌ **Failing Tests (7 test files, 24 tests)**

#### 1. **Middleware Tests** (`middleware.test.ts` - 22/22 failing)
**Issue**: All middleware tests are failing
**Probable Cause**: Middleware implementation changed or test mocks need updating
**Files Affected**:
- Protected route checks (dashboard, admin)
- Security headers (X-Frame-Options, CSP, etc.)
- Session validation

**Required Fixes:**
- Update test mocks for Next.js middleware
- Verify session cookie handling
- Update security header expectations

#### 2. **DB Schema Tests** (`db/schema.test.ts` - 2/15 failing)
**Issue**: Schema structure changed
- Expected 6 tables, found 17 tables ❌
- Expected 12 subscription columns, found 13 columns ❌

**Actual Schema (17 tables):**
1. user
2. session
3. account
4. verification
5. subscription
6. usageLog
7. usageQuota
8. auditLog
9. webhookEvent
10. workspace
11. workspaceMember
12. workspaceInvitation
13. permission
14. rolePermission
15-17. (enums: userRole, workspaceRole, invitationStatus)

**Required Fixes:**
- Update table count expectations
- Update subscription column count
- Add tests for new tables (workspace, permissions, usage, webhooks)

#### 3. **Other Failing Tests** (details needed)
- `next.config.test.ts` (status unknown)
- `sw.test.ts` (status unknown)

---

## Part 2: Test Coverage Gaps

### 🔴 **Critical Missing Tests**

#### 1. **Workspace Management** (0% coverage)
**Files to Test:**
- `src/lib/workspace.ts`
- `src/app/api/workspaces/route.ts`
- `src/app/api/workspaces/[id]/route.ts`

**Required Tests:**
- Create workspace
- Update workspace (name, settings)
- Delete workspace (cascade to members)
- Slug generation and validation
- List user workspaces
- Workspace member management (add, remove, update roles)
- Role-based access control (owner, admin, member, viewer)
- Cross-workspace access prevention

**Test Count Needed:** ~30 tests

#### 2. **Workspace Invitations** (0% coverage)
**Files to Test:**
- `src/lib/workspace-invitation.ts`
- `src/app/api/workspaces/[id]/invitations/route.ts`
- `src/app/api/accept-invitation/route.ts`

**Required Tests:**
- Create invitation with email
- Send invitation email
- Accept invitation
- Decline invitation
- Invitation expiration (7 days)
- Token validation
- Duplicate invitation prevention
- Invalid token handling

**Test Count Needed:** ~15 tests

#### 3. **Workspace Billing** (0% coverage)
**Files to Test:**
- `src/lib/workspace-billing.ts`

**Required Tests:**
- Workspace-level subscriptions
- Effective plan calculation (user + workspace plans)
- Plan precedence (highest plan wins)
- Usage aggregation across workspace members
- Quota enforcement at workspace level

**Test Count Needed:** ~12 tests

#### 4. **Permissions System** (0% coverage)
**Files to Test:**
- `src/lib/permissions.ts`

**Required Tests:**
- Role hierarchy (admin > moderator > editor > member > viewer)
- Permission checks for each role
- Resource-level permissions (users:read, users:write, billing:manage, etc.)
- hasPermission() function for all permission types
- Role-permission mappings

**Test Count Needed:** ~25 tests

#### 5. **Usage Tracking & Quotas** (0% coverage)
**Files to Test:**
- `src/lib/usage-tracker.ts`

**Required Tests:**
- Log AI request usage
- Log API call usage
- Log storage usage
- Monthly quota tracking
- Quota enforcement
- Quota reset on billing cycle
- Warning emails at 80%, 90%, 100%
- Usage statistics aggregation
- Unlimited quota handling (Startup plan)

**Test Count Needed:** ~20 tests

#### 6. **Subscription Features** (0% coverage)
**Files to Test:**
- `src/lib/subscription-features.ts`

**Required Tests:**
- Free plan features (10 AI requests, gpt-3.5-turbo only, 1 API key, 100MB storage)
- Pro plan features (1000 AI requests, multiple models, 5 API keys, 10GB storage)
- Startup plan features (unlimited)
- Feature enforcement (model access, API key limits, storage limits)
- Plan comparison

**Test Count Needed:** ~15 tests

#### 7. **Billing/Polar Integration** (0% coverage)
**Files to Test:**
- `src/lib/polar-client.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/usage/route.ts`
- `src/app/api/billing/subscription/route.ts`

**Required Tests:**
- Create checkout session
- Upgrade/downgrade plans
- Cancel subscription
- Webhook processing (subscription.created, updated, canceled)
- HMAC signature verification
- Quota initialization on subscription
- Billing email notifications

**Test Count Needed:** ~20 tests

#### 8. **Webhook Processing** (0% coverage)
**Files to Test:**
- `src/lib/webhook-processor.ts`
- `src/app/api/webhooks/polar/route.ts`

**Required Tests:**
- Event storage
- Retry logic with exponential backoff
- Dead letter queue for failed events
- Event status tracking
- Duplicate event handling
- Manual retry functionality

**Test Count Needed:** ~15 tests

#### 9. **Email Service** (0% coverage)
**Files to Test:**
- `src/lib/email-service.ts`

**Required Tests:**
- Email verification
- Password reset
- Subscription confirmation
- Payment success/failure
- Quota warning emails
- Subscription cancellation
- Workspace invitation emails
- Email template rendering
- Link generation
- Email personalization

**Test Count Needed:** ~15 tests

#### 10. **Audit Logging** (0% coverage)
**Files to Test:**
- `src/lib/audit-logger.ts`
- `src/app/api/admin/audit-logs/route.ts`

**Required Tests:**
- Log creation for all action types (auth, user, subscription, workspace, etc.)
- IP address tracking
- User agent tracking
- Before/after state tracking
- Audit log retrieval
- Filtering by user, action, date range
- Admin access control
- Sensitive data redaction

**Test Count Needed:** ~12 tests

#### 11. **Analytics API** (0% coverage)
**Files to Test:**
- `src/app/api/analytics/route.ts`

**Required Tests:**
- 7-day analytics
- 30-day analytics
- 90-day analytics
- Usage aggregation
- Chart data formatting
- Authentication required

**Test Count Needed:** ~8 tests

#### 12. **Models API** (0% coverage)
**Files to Test:**
- `src/app/api/models/route.ts`

**Required Tests:**
- List available models
- Plan-based model filtering
- Model metadata (name, provider, capabilities)

**Test Count Needed:** ~5 tests

#### 13. **Sessions API** (0% coverage)
**Files to Test:**
- `src/app/api/sessions/route.ts`

**Required Tests:**
- List user sessions
- Session details (IP, user agent, created date)
- Active vs expired sessions

**Test Count Needed:** ~5 tests

---

### 🟡 **Secondary Missing Tests**

#### 1. **OpenAPI Specification** (0% coverage)
**Files to Test:**
- `src/lib/openapi-spec.ts`

**Test Count Needed:** ~5 tests

#### 2. **Monitoring/Sentry** (0% coverage)
**Files to Test:**
- `src/lib/monitoring.ts`

**Test Count Needed:** ~5 tests

#### 3. **Service Worker** (failing)
**Files to Test:**
- `src/sw.ts`

**Test Count Needed:** Fix existing + 5 more

#### 4. **Next.js Config** (failing)
**Files to Test:**
- `next.config.mjs`

**Test Count Needed:** Fix existing tests

---

## Part 3: Comprehensive Testing Plan

### Phase 1: Fix Failing Tests (Priority: CRITICAL)

#### Task 1.1: Fix Middleware Tests (22 tests)
**Estimated Time:** 2-3 hours
**Steps:**
1. Review current middleware implementation
2. Update test mocks for Next.js 14+ middleware
3. Fix session validation mocks
4. Update security header expectations
5. Verify all protected routes

#### Task 1.2: Fix Schema Tests (2 tests)
**Estimated Time:** 30 minutes
**Steps:**
1. Update table count to 17
2. Count subscription table columns and update
3. Add missing table structure tests

#### Task 1.3: Fix Service Worker Tests
**Estimated Time:** 1 hour
**Steps:**
1. Review SW implementation
2. Update SW test mocks
3. Add offline caching tests

#### Task 1.4: Fix Next Config Tests
**Estimated Time:** 30 minutes
**Steps:**
1. Review Next.js config
2. Update test expectations

---

### Phase 2: Critical Missing Tests (Priority: HIGH)

#### Task 2.1: Workspace Management Tests (~30 tests)
**Estimated Time:** 6-8 hours
**Files to Create:**
- `unit-tests/lib/workspace.test.ts`
- `unit-tests/integration/api-workspaces.test.ts`
- `unit-tests/integration/api-workspace-members.test.ts`

**Test Cases:**
```typescript
describe('Workspace Management', () => {
  describe('Create Workspace', () => {
    it('should create workspace with valid data')
    it('should generate URL-safe slug')
    it('should assign owner role to creator')
    it('should reject invalid workspace names')
    it('should prevent duplicate slugs')
  })

  describe('Update Workspace', () => {
    it('should update workspace name')
    it('should update workspace settings')
    it('should require owner/admin role')
    it('should reject unauthorized updates')
  })

  describe('Delete Workspace', () => {
    it('should delete workspace and cascade to members')
    it('should delete workspace invitations')
    it('should require owner role')
    it('should prevent deletion with active subscriptions')
  })

  describe('Member Management', () => {
    it('should add member to workspace')
    it('should remove member from workspace')
    it('should update member role')
    it('should prevent owner from being removed')
    it('should enforce role hierarchy')
  })
})
```

#### Task 2.2: Workspace Invitations Tests (~15 tests)
**Estimated Time:** 4-5 hours
**Files to Create:**
- `unit-tests/lib/workspace-invitation.test.ts`
- `unit-tests/integration/api-workspace-invitations.test.ts`
- `unit-tests/integration/api-accept-invitation.test.ts`

#### Task 2.3: Permissions System Tests (~25 tests)
**Estimated Time:** 5-6 hours
**Files to Create:**
- `unit-tests/lib/permissions.test.ts`

#### Task 2.4: Usage Tracking Tests (~20 tests)
**Estimated Time:** 5-6 hours
**Files to Create:**
- `unit-tests/lib/usage-tracker.test.ts`
- `unit-tests/integration/api-usage.test.ts`

#### Task 2.5: Subscription Features Tests (~15 tests)
**Estimated Time:** 3-4 hours
**Files to Create:**
- `unit-tests/lib/subscription-features.test.ts`

#### Task 2.6: Billing/Polar Tests (~20 tests)
**Estimated Time:** 6-8 hours
**Files to Create:**
- `unit-tests/lib/polar-client.test.ts`
- `unit-tests/integration/api-billing.test.ts`
- `unit-tests/integration/api-webhooks-polar.test.ts`

#### Task 2.7: Webhook Processing Tests (~15 tests)
**Estimated Time:** 4-5 hours
**Files to Create:**
- `unit-tests/lib/webhook-processor.test.ts`

#### Task 2.8: Email Service Tests (~15 tests)
**Estimated Time:** 4-5 hours
**Files to Create:**
- `unit-tests/lib/email-service.test.ts`

#### Task 2.9: Audit Logging Tests (~12 tests)
**Estimated Time:** 3-4 hours
**Files to Create:**
- `unit-tests/lib/audit-logger.test.ts`
- `unit-tests/integration/api-audit-logs.test.ts`

---

### Phase 3: API Route Tests (Priority: MEDIUM)

#### Task 3.1: Analytics API Tests (~8 tests)
**Estimated Time:** 2-3 hours
**Files to Create:**
- `unit-tests/integration/api-analytics.test.ts`

#### Task 3.2: Models API Tests (~5 tests)
**Estimated Time:** 1-2 hours
**Files to Create:**
- `unit-tests/integration/api-models.test.ts`

#### Task 3.3: Sessions API Tests (~5 tests)
**Estimated Time:** 1-2 hours
**Files to Create:**
- `unit-tests/integration/api-sessions.test.ts`

---

### Phase 4: Utility & Config Tests (Priority: LOW)

#### Task 4.1: OpenAPI Spec Tests (~5 tests)
**Estimated Time:** 1-2 hours

#### Task 4.2: Monitoring Tests (~5 tests)
**Estimated Time:** 1-2 hours

---

## Part 4: Test Implementation Strategy

### Testing Best Practices

1. **Unit Tests**
   - Test one function/method at a time
   - Mock external dependencies
   - Cover happy path + edge cases + error scenarios
   - Use descriptive test names

2. **Integration Tests**
   - Test API endpoints end-to-end
   - Mock database and external services
   - Test authentication and authorization
   - Test request/response validation

3. **Test Structure**
   ```typescript
   describe('Feature Name', () => {
     beforeEach(() => {
       // Setup mocks and test data
     })

     afterEach(() => {
       // Cleanup
     })

     describe('Functionality', () => {
       it('should handle success case', () => {
         // Arrange
         // Act
         // Assert
       })

       it('should handle error case', () => {
         // Arrange
         // Act
         // Assert
       })

       it('should validate input', () => {
         // Arrange
         // Act
         // Assert
       })
     })
   })
   ```

4. **Coverage Goals**
   - Functions: 90%+
   - Branches: 85%+
   - Lines: 90%+
   - Statements: 90%+

5. **Test Data Management**
   - Use factory functions for test data
   - Create reusable fixtures
   - Avoid hard-coded values

---

## Part 5: Estimated Timeline

### Summary
- **Phase 1 (Critical Fixes):** 4-6 hours
- **Phase 2 (Critical Tests):** 40-50 hours
- **Phase 3 (API Tests):** 4-7 hours
- **Phase 4 (Utility Tests):** 2-4 hours

**Total Estimated Time:** 50-67 hours (~6-8 working days)

**New Tests to Add:** ~250 tests

**Final Test Count:** ~530 tests (282 existing + 250 new)

---

## Part 6: Test Execution Commands

### Run All Tests
```bash
pnpm test:run
```

### Run Tests in Watch Mode
```bash
pnpm test
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Run E2E Tests
```bash
pnpm test:e2e
```

### Run E2E Tests in UI Mode
```bash
pnpm test:e2e:ui
```

---

## Part 7: Continuous Integration

### Recommended CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: npx playwright install
      - run: pnpm test:e2e
```

---

## Part 8: Success Criteria

### Definition of Done

✅ All 24 failing tests fixed
✅ All 250 new tests implemented
✅ 90%+ code coverage across critical modules
✅ All tests pass in CI/CD pipeline
✅ No flaky tests
✅ Test documentation updated
✅ E2E tests cover critical user journeys

---

## Conclusion

This comprehensive testing plan will bring test coverage from **~40%** to **~90%+**. The phased approach ensures critical functionality is tested first, with a focus on fixing existing issues before adding new tests.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: Fix failing tests
3. Proceed to Phase 2: Implement critical missing tests
4. Monitor coverage metrics throughout implementation
5. Set up CI/CD integration

**Key Benefits:**
- ✅ Higher confidence in code quality
- ✅ Faster bug detection
- ✅ Easier refactoring
- ✅ Better documentation through tests
- ✅ Reduced production incidents
