import '@testing-library/jest-dom'
import { config } from 'dotenv'
import React from 'react'
import { vi } from 'vitest'

// Load environment variables from .env file
config()

// Set test-specific environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-key-32-chars-long-for-aes256!!!'
process.env.POLAR_PRODUCT_FREE = process.env.POLAR_PRODUCT_FREE || 'free_product_id'
process.env.POLAR_PRODUCT_PRO = process.env.POLAR_PRODUCT_PRO || 'pro_product_id'
process.env.POLAR_PRODUCT_STARTUP = process.env.POLAR_PRODUCT_STARTUP || 'startup_product_id'

// Make React available globally for tests
global.React = React

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})