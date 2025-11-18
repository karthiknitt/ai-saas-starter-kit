import '@testing-library/jest-dom';
import { config } from 'dotenv';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

// Mock server-only module to prevent import errors in tests
vi.mock('server-only', () => ({}));

// Load environment variables from .env file
config();

// Set test-specific environment variables
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.ARCJET_KEY = process.env.ARCJET_KEY || 'test_arcjet_key';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test_resend_key';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'test-key-32-chars-long-for-aes256!!!';
process.env.POLAR_PRODUCT_FREE =
  process.env.POLAR_PRODUCT_FREE || 'free_product_id';
process.env.POLAR_PRODUCT_PRO =
  process.env.POLAR_PRODUCT_PRO || 'pro_product_id';
process.env.POLAR_PRODUCT_STARTUP =
  process.env.POLAR_PRODUCT_STARTUP || 'startup_product_id';

// Make React available globally for tests
global.React = React;

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods to suppress expected error logs during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Suppress console.error and console.warn during tests to avoid stderr output in CI
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.error = originalError;
  console.warn = originalWarn;
});
