# Quick Start: Running E2E Tests

## ⚡ TL;DR

**On Windows (PowerShell):**
```powershell
# 1. Update your .env file (IMPORTANT!)
# Change DATABASE_URL to: postgresql://postgres:postgres@localhost:5432/ai_saas_dev

# 2. Run the automated setup
.\scripts\setup-e2e-tests.ps1
```

**On macOS/Linux:**
```bash
# 1. Update your .env file (IMPORTANT!)
# Change DATABASE_URL to: postgresql://postgres:postgres@localhost:5432/ai_saas_dev

# 2. Run the automated setup
pnpm test:e2e:setup
```

That's it! The setup script will handle everything else.

---

## 📋 What Was The Problem?

The e2e tests were timing out with:
```
Error: Timed out waiting 120000ms from config.webServer.
```

**Root Cause**: Your `.env` file had incorrect database credentials that didn't match the `docker-compose.yml` configuration. This prevented the dev server from starting.

## 🔧 The Fix

### Step 1: Update Your `.env` File

**Change this line:**
```env
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

**To this:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_saas_dev
```

This matches the credentials in `docker-compose.yml`:
- Username: `postgres` (was: test)
- Password: `postgres` (was: test)
- Database: `ai_saas_dev` (was: test_db)

### Step 2: Run the Setup Script

The setup script will automatically:
- ✅ Start Docker containers (PostgreSQL, Redis, Mailhog)
- ✅ Wait for PostgreSQL to be ready
- ✅ Push database schema
- ✅ Seed test data
- ✅ Optionally run the tests

**Windows (PowerShell):**
```powershell
.\scripts\setup-e2e-tests.ps1
```

**macOS/Linux:**
```bash
pnpm test:e2e:setup
# or directly:
./scripts/setup-e2e-tests.sh
```

## 🧪 Running Tests After Setup

```bash
# Run all tests
pnpm test:e2e

# Run with UI (recommended for debugging)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run specific browser
pnpm test:e2e --project=chromium
```

## 📊 Expected Results

After running tests, you should see significant improvements:

**Before fixes**: 70 passing, 170 failing (29.2% pass rate)
**After Phase 1 fixes**: Expected 120-150 passing (50-60% pass rate)

Phase 1 fixes addressed:
- ✅ Authentication UI elements (login/signup forms)
- ✅ Password reset success message
- ✅ Admin page navigation (sidebar)
- ✅ Form validation messages
- ✅ Button text and headings

## 📖 Full Documentation

For complete details, see:
- **[E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)** - Comprehensive testing guide with troubleshooting
- **[E2E_TEST_DIAGNOSTIC_REPORT.md](./E2E_TEST_DIAGNOSTIC_REPORT.md)** - Detailed test status and fix plan

## 🆘 Still Having Issues?

1. **Check Docker is running**:
   ```bash
   docker ps
   ```
   You should see `ai-saas-postgres` running.

2. **Check database logs**:
   ```bash
   pnpm docker:logs
   ```

3. **Reset database completely**:
   ```bash
   pnpm docker:reset
   pnpm db:push
   pnpm db:seed
   ```

4. **See full troubleshooting guide** in [E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md#troubleshooting)
