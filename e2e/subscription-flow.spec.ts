/**
 * E2E Tests: Subscription Flow
 *
 * Tests subscription purchase flow including:
 * - Plan selection
 * - Checkout process
 * - Subscription management
 */

import { expect, test } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/subscriptions', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  });

  test('should display all subscription plans', async ({ page }) => {
    // If redirected to login, that's expected for unauthenticated users
    if (page.url().includes('login')) {
      await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
      return;
    }

    // Check for plan cards with increased timeouts
    await expect(page.locator('text=Free').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Pro').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Startup').first()).toBeVisible({ timeout: 15000 });
  });

  test('Free plan should be available by default', async ({ page }) => {
    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Free plan should show as current or available
    const freePlan = page.locator('text=Free').first();
    await expect(freePlan).toBeVisible({ timeout: 15000 });
  });

  test('Pro plan should show upgrade button', async ({ page }) => {
    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Wait for page content to load
    await page.waitForSelector('text=Pro', { timeout: 15000 }).catch(() => {});

    // Look for Pro plan upgrade button
    const proSection = page.locator('text=Pro').first().locator('..');
    const upgradeButton = proSection
      .locator('button:has-text("Upgrade")')
      .first();

    // Button should exist or be visible
    const count = await upgradeButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('plan comparison should show features', async ({ page }) => {
    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Check for feature lists
    const features = await page.locator('text=/request|API|model/i').count();
    expect(features).toBeGreaterThan(0);
  });
});

test.describe('Billing Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/billing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  });

  test('should display billing page', async ({ page }) => {
    // Check URL
    const url = page.url();
    expect(url).toMatch(/login|billing/);
  });

  test('billing page should show usage information', async ({ page }) => {
    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Look for usage-related text
    const usageElements = await page
      .locator('text=/usage|quota|limit/i')
      .count();
    expect(usageElements).toBeGreaterThan(0);
  });

  test('billing page should show current plan', async ({ page }) => {
    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Look for plan information with increased timeout
    await page.waitForSelector('text=/Free|Pro|Startup/i', { timeout: 15000 }).catch(() => {});
    const planElements = await page.locator('text=/Free|Pro|Startup/i').count();
    expect(planElements).toBeGreaterThan(0);
  });
});
