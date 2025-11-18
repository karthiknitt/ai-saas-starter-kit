import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./unit-tests/setup.ts'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 10000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.next/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
    environmentMatchGlobs: [
      // Use node environment for API route tests to avoid server-only import issues
      ['unit-tests/integration/api-*.test.ts', 'node'],
      // Use jsdom for component tests
      ['unit-tests/integration/components/**', 'jsdom'],
      ['unit-tests/components/**', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
