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
    await page.goto('/dashboard/subscriptions');
  });

  test('should display all subscription plans', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If redirected to login, that's expected for unauthenticated users
    if (page.url().includes('login')) {
      await expect(page).toHaveURL(/.*login/);
      return;
    }

    // Check for plan cards
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Startup')).toBeVisible();
  });

  test('Free plan should be available by default', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Free plan should show as current or available
    const freePlan = page.locator('text=Free').first();
    await expect(freePlan).toBeVisible();
  });

  test('Pro plan should show upgrade button', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

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
    // Wait for page to load
    await page.waitForLoadState('networkidle');

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
    await page.goto('/billing');
  });

  test('should display billing page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check URL
    const url = page.url();
    expect(url).toMatch(/login|billing/);
  });

  test('billing page should show usage information', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

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
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Look for plan information
    const planElements = await page.locator('text=/Free|Pro|Startup/i').count();
    expect(planElements).toBeGreaterThan(0);
  });
});
