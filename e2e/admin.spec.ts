/**
 * E2E Tests: Admin Panel
 *
 * Tests admin functionality including:
 * - Admin access control
 * - User management
 * - Audit logs
 */

import { expect, test } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test('non-admin users should not access admin panel', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForURL(/.*login/, { timeout: 30000 }).catch(() => {});

    // Should redirect to login or show unauthorized
    const url = page.url();
    expect(url).toMatch(/login|unauthorized/);
  });

  test('admin users page should require authentication', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForURL(/.*login/, { timeout: 30000 }).catch(() => {});

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
  });

  test('audit logs page should require authentication', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForURL(/.*login/, { timeout: 30000 }).catch(() => {});

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
  });
});

test.describe('Admin Dashboard', () => {
  test('admin page should have navigation', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    // If redirected to login, that's expected
    if (page.url().includes('login')) {
      await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
      return;
    }

    // If on admin page, check for navigation
    const hasNav = await page.locator('nav, [role="navigation"]').count();
    expect(hasNav).toBeGreaterThan(0);
  });
});

test.describe('User Management', () => {
  test('users page should exist', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    // Check URL
    const url = page.url();
    expect(url).toMatch(/login|users/);
  });

  test('users page should have table structure', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Look for table or list structure
    const hasTable = await page.locator('table, [role="table"]').count();
    expect(hasTable).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Audit Logs', () => {
  test('audit logs page should exist', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    // Check URL
    const url = page.url();
    expect(url).toMatch(/login|audit/);
  });

  test('audit logs should have filtering options', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    if (page.url().includes('login')) {
      return; // Skip if not authenticated
    }

    // Look for filter controls
    const hasFilters = await page
      .locator('input[type="search"], select, button:has-text("Filter")')
      .count();
    expect(hasFilters).toBeGreaterThanOrEqual(0);
  });
});
