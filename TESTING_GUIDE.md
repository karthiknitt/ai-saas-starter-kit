# Quick Testing Guide

## Test Structure

All unit tests are located in the `unit-tests/` directory.

## Running Tests

- `npm run test` - Run all tests in watch mode
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:coverage` - Run with coverage report

## Key Patterns

1. Use proper setup/teardown with beforeEach/afterEach
2. Mock external dependencies with vi.mock()
3. Test edge cases and error conditions
4. Follow AAA pattern: Arrange, Act, Assert

## Resources

- Vitest: <https://vitest.dev/>
- Testing Library: <https://testing-library.com/>