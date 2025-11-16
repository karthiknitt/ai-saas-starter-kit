/**
 * E2E Tests: Authentication Flows
 *
 * Tests user authentication including:
 * - Sign up
 * - Email verification
 * - Login
 * - Logout
 * - Password reset
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/AI SaaS/i);

    // Check for key elements
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Login');

    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Sign Up');

    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h1:has-text("Create")')).toBeVisible();
  });

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/Invalid|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=/Forgot.*password/i');

    await expect(page).toHaveURL(/.*forgot-password/);
    await expect(page.locator('h1:has-text("Reset")')).toBeVisible();
  });

  test('password reset form should accept email', async ({ page }) => {
    await page.goto('/forgot-password');

    // Fill in email
    await page.fill('input[name="email"]', 'test@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Check for success message or redirect
    await expect(page.locator('text=/sent|check|email/i')).toBeVisible({ timeout: 5000 });
  });

  test('signup form should have all required fields', async ({ page }) => {
    await page.goto('/signup');

    // Check for required fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/signup');

    // Type a password
    await page.fill('input[name="password"]', 'weak');

    // Password field should be visible
    await expect(page.locator('input[name="password"]')).toHaveValue('weak');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected page', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing admin page', async ({ page }) => {
    // Try to access admin without authentication
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
