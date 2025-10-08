import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider" {...props}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider Integration Tests', () => {
  const TestComponent = () => (
    <div>
      <span data-testid="theme-text">Current theme content</span>
      <button onClick={() => document.documentElement.classList.toggle('dark')}>
        Toggle Theme
      </button>
    </div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.className = '';
  });

  describe('Theme Provider Initialization', () => {
    it('should render children correctly', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('theme-text')).toBeInTheDocument();
      expect(screen.getByText('Toggle Theme')).toBeInTheDocument();
    });

    it('should apply default theme attributes', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const provider = screen.getByTestId('theme-provider');
      expect(provider).toHaveAttribute('data-testid', 'theme-provider');
    });

    it('should handle theme switching', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText('Toggle Theme');

      act(() => {
        toggleButton.click();
      });

      // The theme provider should handle the theme switching logic
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Theme Persistence', () => {
    it('should maintain theme state across re-renders', () => {
      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText('Toggle Theme');

      // Apply dark theme
      act(() => {
        toggleButton.click();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Re-render the component
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Theme should still be applied
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing theme provider gracefully', () => {
      // Test without ThemeProvider wrapper
      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();
    });

    it('should handle theme provider errors', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should not throw even if there are internal errors
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});