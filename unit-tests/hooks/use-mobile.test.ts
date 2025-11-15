import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('use-mobile', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia
    mockMatchMedia = vi.fn();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  describe('useIsMobile', () => {
    it('should return false for desktop width (1024px)', () => {
      // Mock matchMedia to return false for max-width: 767px
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return true for mobile width (767px)', () => {
      // Set window width to mobile (767px is below breakpoint)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      // Mock matchMedia to return true for max-width: 767px
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return true for small mobile width (375px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should update when window resizes', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();

      // Initially desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      mockMatchMedia.mockReturnValue({
        matches: false, // Initially desktop
        addEventListener,
        removeEventListener,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      // Simulate resize event
      const changeCallback = addEventListener.mock.calls[0][1];
      act(() => {
        // Mock the media query change to mobile
        changeCallback({ matches: true });
      });

      expect(result.current).toBe(true);
    });

    it('should clean up event listeners on unmount', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener,
      });

      const { unmount } = renderHook(() => useIsMobile());

      expect(addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('should handle edge case at breakpoint (767px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      mockMatchMedia.mockReturnValue({
        matches: true, // max-width: 767px should match
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle edge case just above breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      mockMatchMedia.mockReturnValue({
        matches: false, // max-width: 767px should not match
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });
});
