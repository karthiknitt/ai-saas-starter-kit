import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePerformance } from '@/hooks/use-performance'

describe('usePerformance', () => {
  const mockPerformance = {
    getEntriesByType: vi.fn(),
  }

  beforeEach(() => {
    global.performance = mockPerformance as any
    global.document = { readyState: 'loading' } as any
    global.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      gtag: undefined,
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should return loading state initially', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.metrics).toEqual({})
    })

    it('should provide rating helper functions', () => {
      const { result } = renderHook(() => usePerformance())

      expect(typeof result.current.getRating).toBe('function')
      expect(typeof result.current.getLCPRating).toBe('function')
      expect(typeof result.current.getFCPRating).toBe('function')
      expect(typeof result.current.getTTFBRating).toBe('function')
    })
  })

  describe('metrics collection', () => {
    it('should collect LCP metric when available', async () => {
      const lcpEntry = { name: 'largest-contentful-paint', startTime: 1500 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') return [lcpEntry]
        if (type === 'navigation') return []
        if (type === 'paint') return []
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.lcp).toBe(1500)
    })

    it('should collect FCP metric when available', async () => {
      const fcpEntry = { name: 'first-contentful-paint', startTime: 1200 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'paint') return [fcpEntry]
        if (type === 'navigation') return []
        if (type === 'largest-contentful-paint') return []
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.fcp).toBe(1200)
    })

    it('should collect TTFB from navigation timing', async () => {
      const navigationEntry = {
        responseStart: 500,
        requestStart: 100,
        loadEventEnd: 2000,
        loadEventStart: 1800,
      }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'navigation') return [navigationEntry]
        if (type === 'paint') return []
        if (type === 'largest-contentful-paint') return []
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.ttfb).toBe(400) // 500 - 100
      expect(result.current.metrics.loadTime).toBe(200) // 2000 - 1800
    })

    it('should handle missing metrics gracefully', async () => {
      mockPerformance.getEntriesByType.mockReturnValue([])
      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics).toEqual({})
    })
  })

  describe('metric ratings', () => {
    it('should rate LCP as good when <= 2500ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 2000)).toBe('good')
      expect(result.current.getRating('lcp', 2500)).toBe('good')
    })

    it('should rate LCP as needs-improvement when > 2500ms and <= 4000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 3000)).toBe('needs-improvement')
      expect(result.current.getRating('lcp', 4000)).toBe('needs-improvement')
    })

    it('should rate LCP as poor when > 4000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 4500)).toBe('poor')
      expect(result.current.getRating('lcp', 10000)).toBe('poor')
    })

    it('should rate FCP as good when <= 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 1500)).toBe('good')
      expect(result.current.getRating('fcp', 1800)).toBe('good')
    })

    it('should rate FCP as needs-improvement when > 1800ms and <= 3000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 2000)).toBe('needs-improvement')
      expect(result.current.getRating('fcp', 3000)).toBe('needs-improvement')
    })

    it('should rate FCP as poor when > 3000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 3500)).toBe('poor')
    })

    it('should rate TTFB as good when <= 800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 500)).toBe('good')
      expect(result.current.getRating('ttfb', 800)).toBe('good')
    })

    it('should rate TTFB as needs-improvement when > 800ms and <= 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 1000)).toBe('needs-improvement')
      expect(result.current.getRating('ttfb', 1800)).toBe('needs-improvement')
    })

    it('should rate TTFB as poor when > 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 2000)).toBe('poor')
    })

    it('should return unknown for missing metrics', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp')).toBe('unknown')
      expect(result.current.getRating('fcp', undefined)).toBe('unknown')
    })

    it('should return unknown for unhandled metric types', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('cls' as any, 1000)).toBe('unknown')
    })
  })

  describe('helper rating functions', () => {
    it('getLCPRating should use metrics.lcp', async () => {
      const lcpEntry = { name: 'largest-contentful-paint', startTime: 2000 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') return [lcpEntry]
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getLCPRating()).toBe('good')
    })

    it('getFCPRating should use metrics.fcp', async () => {
      const fcpEntry = { name: 'first-contentful-paint', startTime: 2500 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'paint') return [fcpEntry]
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getFCPRating()).toBe('needs-improvement')
    })

    it('getTTFBRating should use metrics.ttfb', async () => {
      const navigationEntry = {
        responseStart: 1000,
        requestStart: 100,
        loadEventEnd: 2000,
        loadEventStart: 1800,
      }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'navigation') return [navigationEntry]
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getTTFBRating()).toBe('needs-improvement') // 900ms
    })
  })

  describe('analytics integration', () => {
    it('should send metrics to gtag if available', async () => {
      const mockGtag = vi.fn()
      global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        gtag: mockGtag,
      } as any

      const lcpEntry = { name: 'largest-contentful-paint', startTime: 2000 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') return [lcpEntry]
        return []
      })

      global.document = { readyState: 'complete' } as any

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'LCP',
          value: 2000,
        })
      })
    })

    it('should not throw if gtag is not available', async () => {
      global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        gtag: undefined,
      } as any

      mockPerformance.getEntriesByType.mockReturnValue([])
      global.document = { readyState: 'complete' } as any

      expect(() => {
        renderHook(() => usePerformance())
      }).not.toThrow()
    })
  })

  describe('event listeners', () => {
    it('should add load event listener when document not ready', () => {
      const addEventListener = vi.fn()
      global.window = {
        addEventListener,
        removeEventListener: vi.fn(),
      } as any
      global.document = { readyState: 'loading' } as any

      renderHook(() => usePerformance())

      expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function))
    })

    it('should collect metrics immediately if document is complete', () => {
      mockPerformance.getEntriesByType.mockReturnValue([])
      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      expect(mockPerformance.getEntriesByType).toHaveBeenCalled()
    })

    it('should clean up event listener on unmount', () => {
      const removeEventListener = vi.fn()
      global.window = {
        addEventListener: vi.fn(),
        removeEventListener,
      } as any
      global.document = { readyState: 'loading' } as any

      const { unmount } = renderHook(() => usePerformance())
      unmount()

      expect(removeEventListener).toHaveBeenCalledWith('load', expect.any(Function))
    })
  })

  describe('console logging', () => {
    it('should log metrics to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      const lcpEntry = { name: 'largest-contentful-paint', startTime: 2000 }
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') return [lcpEntry]
        return []
      })

      global.document = { readyState: 'complete' } as any

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Performance Metrics:',
          expect.objectContaining({ lcp: 2000 })
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle null performance entries', async () => {
      mockPerformance.getEntriesByType.mockReturnValue(null as any)
      global.document = { readyState: 'complete' } as any

      expect(() => {
        renderHook(() => usePerformance())
      }).not.toThrow()
    })

    it('should handle empty navigation entry array', async () => {
      mockPerformance.getEntriesByType.mockReturnValue([])
      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.ttfb).toBeUndefined()
    })

    it('should handle multiple paint entries', async () => {
      const paintEntries = [
        { name: 'first-paint', startTime: 1000 },
        { name: 'first-contentful-paint', startTime: 1200 },
      ]
      mockPerformance.getEntriesByType.mockImplementation((type) => {
        if (type === 'paint') return paintEntries
        return []
      })

      global.document = { readyState: 'complete' } as any

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.fcp).toBe(1200)
    })

    it('should handle zero metric values', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 0)).toBe('good')
      expect(result.current.getRating('fcp', 0)).toBe('good')
      expect(result.current.getRating('ttfb', 0)).toBe('good')
    })

    it('should handle negative metric values gracefully', () => {
      const { result } = renderHook(() => usePerformance())
      
      // Negative values should still be rated
      expect(result.current.getRating('lcp', -100)).toBe('good')
    })
  })
})