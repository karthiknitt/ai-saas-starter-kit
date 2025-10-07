import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePerformance } from '@/hooks/use-performance'

describe('usePerformance', () => {
  beforeEach(() => {
    // Mock performance API
    const mockPerformance = {
      getEntriesByType: vi.fn((type: string) => {
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        if (type === 'paint') {
          return [
            {
              name: 'first-contentful-paint',
              startTime: 150,
            },
          ]
        }
        if (type === 'largest-contentful-paint') {
          return [
            {
              startTime: 200,
            },
          ]
        }
        return []
      }),
    }

    global.performance = mockPerformance as unknown as Performance
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('metrics collection', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.metrics).toEqual({})
    })

    it('should collect performance metrics after load', async () => {
      // Mock document ready state
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics).toBeDefined()
    })

    it('should collect LCP metric', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.lcp).toBeDefined()
      })

      expect(result.current.metrics.lcp).toBe(200)
    })

    it('should collect FCP metric', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.fcp).toBeDefined()
      })

      expect(result.current.metrics.fcp).toBe(150)
    })

    it('should collect TTFB metric', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.ttfb).toBeDefined()
      })

      expect(result.current.metrics.ttfb).toBe(50)
    })

    it('should collect load time metric', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.loadTime).toBeDefined()
      })

      expect(result.current.metrics.loadTime).toBe(50)
    })
  })

  describe('rating functions', () => {
    it('should rate LCP as good for values <= 2500', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getLCPRating()).toBe('good')
      })
    })

    it('should rate LCP as needs-improvement for values 2500-4000', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 3000 }]
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getLCPRating()).toBe('needs-improvement')
      })
    })

    it('should rate LCP as poor for values > 4000', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 5000 }]
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getLCPRating()).toBe('poor')
      })
    })

    it('should rate FCP as good for values <= 1800', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'paint') {
          return [{ name: 'first-contentful-paint', startTime: 1500 }]
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getFCPRating()).toBe('good')
      })
    })

    it('should rate TTFB as good for values <= 800', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'navigation') {
          return [
            {
              responseStart: 850,
              requestStart: 100,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getTTFBRating()).toBe('good')
      })
    })

    it('should return unknown for missing metrics', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.getLCPRating()).toBe('unknown')
      expect(result.current.getFCPRating()).toBe('unknown')
      expect(result.current.getTTFBRating()).toBe('unknown')
    })
  })

  describe('edge cases', () => {
    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance
      // @ts-expect-error - Testing missing performance API
      delete global.performance

      expect(() => renderHook(() => usePerformance())).not.toThrow()

      global.performance = originalPerformance
    })

    it('should handle missing LCP entry', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'largest-contentful-paint') {
          return []
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.lcp).toBeUndefined()
    })

    it('should handle missing FCP entry', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'paint') {
          return []
        }
        if (type === 'navigation') {
          return [
            {
              responseStart: 100,
              requestStart: 50,
              loadEventEnd: 300,
              loadEventStart: 250,
            },
          ]
        }
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.fcp).toBeUndefined()
    })

    it('should handle missing navigation timing', async () => {
      global.performance.getEntriesByType = vi.fn((type: string) => {
        if (type === 'navigation') {
          return []
        }
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.ttfb).toBeUndefined()
    })
  })

  describe('window event handling', () => {
    it('should wait for load event if document not ready', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading',
      })

      const { result } = renderHook(() => usePerformance())

      expect(result.current.isLoading).toBe(true)
    })

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading',
      })

      const { unmount } = renderHook(() => usePerformance())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))
    })
  })
})