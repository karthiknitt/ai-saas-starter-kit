# E2E Testing Guide

This guide explains how to set up and run end-to-end (e2e) tests for this project using Playwright.

## Prerequisites

1. **Docker Desktop** - Required to run the PostgreSQL database
   - Download: https://www.docker.com/products/docker-desktop/
   - Ensure Docker Desktop is running before starting tests

2. **Node.js and pnpm** - Already installed if you can run the project

## Quick Start (Automated Setup)

### Option 1: Using the setup script (Recommended)

**On Windows (PowerShell):**
```powershell
.\scripts\setup-e2e-tests.ps1
```

**On macOS/Linux:**
```bash
pnpm test:e2e:setup
# or
./scripts/setup-e2e-tests.sh
```

This script will:
- ✅ Check if Docker is running
- ✅ Start PostgreSQL database container
- ✅ Wait for database to be ready
- ✅ Push database schema
- ✅ Seed test data
- ✅ Optionally run the tests

### Option 2: Manual Setup

If you prefer to set up manually:

```bash
# 1. Start Docker containers
pnpm docker:up

# 2. Wait a few seconds for PostgreSQL to start
# (You can check status with: docker ps)

# 3. Push database schema
pnpm db:push

# 4. Seed test data
pnpm db:seed

# 5. Run the tests
pnpm test:e2e
```

## Running Tests

After setup, you can run tests in different modes:

```bash
# Run all tests (headless mode)
pnpm test:e2e

# Run tests with interactive UI
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run tests in specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Total Tests**: 48 unique tests × 5 browsers = 240 test executions
- **Server Timeout**: 120 seconds (2 minutes)

## Test Structure

E2E tests are located in the `e2e/` directory:

- `e2e/auth.spec.ts` - Authentication flows (login, signup, password reset)
- `e2e/admin.spec.ts` - Admin access and permissions
- `e2e/dashboard.spec.ts` - Dashboard navigation and features
- `e2e/subscription-flow.spec.ts` - Subscription and billing flows
- `e2e/theme-readability.spec.ts` - Theme switching and accessibility

## Viewing Test Results

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

This opens an interactive report in your browser showing:
- ✅ Passed tests
- ❌ Failed tests
- 📸 Screenshots of failures
- 🎥 Videos of test runs
- 📊 Test timing and performance

## Troubleshooting

### Error: "Timed out waiting from config.webServer"

**Cause**: The development server failed to start, usually due to database connection issues.

**Solutions**:
1. Ensure Docker Desktop is running
2. Check database credentials in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_saas_dev
   ```
3. Restart Docker containers:
   ```bash
   pnpm docker:reset
   ```
4. Check Docker logs:
   ```bash
   pnpm docker:logs
   ```

### Error: "Connection refused" or "ECONNREFUSED"

**Cause**: PostgreSQL container is not running or not ready.

**Solutions**:
1. Check if container is running:
   ```bash
   docker ps | grep ai-saas-postgres
   ```
2. Start containers:
   ```bash
   pnpm docker:up
   ```
3. Wait for PostgreSQL to be ready (check logs):
   ```bash
   docker logs ai-saas-postgres
   ```

### Error: "Port 3000 is already in use"

**Cause**: Another dev server is already running.

**Solutions**:
1. Stop the running dev server
2. Or set `reuseExistingServer: true` in `playwright.config.ts` (already configured)

### Database Schema Issues

If you see database schema errors:

```bash
# Reset database completely
pnpm docker:reset

# Push schema again
pnpm db:push

# Seed data again
pnpm db:seed
```

## Database Management

```bash
# Start database containers
pnpm docker:up

# Stop database containers (preserves data)
pnpm docker:down

# View container logs
pnpm docker:logs

# Reset database (deletes all data and recreates)
pnpm docker:reset

# Open database studio (GUI)
pnpm db:studio

# Push schema changes
pnpm db:push

# Seed test data
pnpm db:seed
```

## Environment Variables

The `.env` file contains all required environment variables for testing. Key variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_saas_dev

# Auth
BETTER_AUTH_SECRET=test-secret-for-e2e-testing-only
BETTER_AUTH_URL=http://localhost:3000

# Other services use test values
```

## CI/CD Integration

In CI environments, tests run with:
- Single worker (sequential execution)
- 2 retries on failure
- HTML and GitHub reporters
- No server reuse

Set `CI=true` environment variable to enable CI mode.

## Best Practices

1. **Always start with a clean database** between test runs:
   ```bash
   pnpm docker:reset && pnpm db:push && pnpm db:seed
   ```

2. **Use test.beforeEach** to ensure test isolation

3. **Use data-testid attributes** for reliable selectors:
   ```tsx
   <button data-testid="login-button">Login</button>
   ```

4. **Wait for elements** instead of using fixed delays:
   ```ts
   await page.waitForSelector('[data-testid="dashboard"]');
   ```

5. **Check the HTML report** after failures for screenshots and videos

## Writing New Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test code
    await page.click('[data-testid="button"]');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

## Resources

- **Playwright Documentation**: https://playwright.dev/
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Debugging Tests**: https://playwright.dev/docs/debug
- **Selectors**: https://playwright.dev/docs/selectors

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker logs: `pnpm docker:logs`
3. Check test report: `pnpm exec playwright show-report`
4. Enable debug mode: `pnpm test:e2e:debug`

## Current Test Status

See `E2E_TEST_DIAGNOSTIC_REPORT.md` for detailed status of all tests, known issues, and implementation plan.
