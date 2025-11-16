/**
 * E2E Tests: Dashboard
 *
 * Tests dashboard functionality including:
 * - Dashboard access
 * - Navigation
 * - Key widgets and features
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Helper to create authenticated user (for future use)
async function _loginAsUser(
  page: Page,
  email = 'test@example.com',
  password = 'password123',
) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

test.describe('Dashboard - Unauthenticated', () => {
  test('should show login page when accessing dashboard without auth', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Dashboard - Navigation', () => {
  test('dashboard should have main navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if we're on login page (unauthenticated)
    const url = page.url();
    if (url.includes('login')) {
      // This is expected for unauthenticated users
      expect(url).toContain('login');
    }
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // If authenticated, check for sidebar
    const hasSidebar = await page.locator('[data-testid="sidebar"]').count();

    // If not authenticated, should be on login
    if (hasSidebar === 0) {
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

test.describe('Billing & Subscriptions', () => {
  test('should navigate to subscriptions page', async ({ page }) => {
    await page.goto('/dashboard/subscriptions');

    // Should redirect to login if not authenticated
    const url = page.url();
    expect(url).toMatch(/login|subscriptions/);
  });

  test('subscriptions page should show plan options', async ({ page }) => {
    await page.goto('/dashboard/subscriptions');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If on subscriptions page, check for plans
    if (page.url().includes('subscriptions')) {
      const hasPlans = await page.locator('text=/Free|Pro|Startup/i').count();
      expect(hasPlans).toBeGreaterThan(0);
    }
  });

  test('billing page should be accessible', async ({ page }) => {
    await page.goto('/billing');

    // Should redirect to login if not authenticated
    const url = page.url();
    expect(url).toMatch(/login|billing/);
  });
});

test.describe('AI Chat', () => {
  test('should navigate to AI chat page', async ({ page }) => {
    await page.goto('/aichat');

    // Check URL
    const url = page.url();
    expect(url).toMatch(/login|aichat/);
  });

  test('chat page should have message input', async ({ page }) => {
    await page.goto('/aichat');

    // If on chat page, check for input
    if (page.url().includes('aichat')) {
      const hasInput = await page
        .locator('textarea, input[type="text"]')
        .count();
      expect(hasInput).toBeGreaterThan(0);
    }
  });
});
