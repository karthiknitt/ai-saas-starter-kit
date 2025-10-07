import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePerformance } from '@/hooks/use-performance'

describe('use-performance', () => {
  let mockPerformance: typeof performance
  let mockWindow: typeof window

  beforeEach(() => {
    // Save original implementations
    mockPerformance = global.performance
    mockWindow = global.window

    // Mock performance API
    global.performance = {
      getEntriesByType: vi.fn(() => []),
      now: vi.fn(() => Date.now()),
    } as any

    // Mock window object
    global.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      gtag: vi.fn(),
    } as any

    // Mock document
    Object.defineProperty(global.document, 'readyState', {
      writable: true,
      value: 'loading'
    })
  })

  afterEach(() => {
    global.performance = mockPerformance
    global.window = mockWindow
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.metrics).toEqual({})
    })

    it('should initialize with empty metrics', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.metrics).toEqual({})
      expect(result.current.metrics.lcp).toBeUndefined()
      expect(result.current.metrics.fcp).toBeUndefined()
      expect(result.current.metrics.ttfb).toBeUndefined()
    })
  })

  describe('performance metrics collection', () => {
    it('should collect LCP (Largest Contentful Paint)', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        if (type === 'navigation') return []
        if (type === 'paint') return []
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.lcp).toBe(2500)
    })

    it('should collect FCP (First Contentful Paint)', async () => {
      const mockFCP = { name: 'first-contentful-paint', startTime: 1800 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'paint') return [mockFCP]
        if (type === 'navigation') return []
        if (type === 'largest-contentful-paint') return []
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.fcp).toBe(1800)
      })
    })

    it('should collect TTFB (Time to First Byte)', async () => {
      const mockNavigation = {
        responseStart: 300,
        requestStart: 100,
        loadEventEnd: 5000,
        loadEventStart: 4000
      }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'navigation') return [mockNavigation]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.ttfb).toBe(200)
        expect(result.current.metrics.loadTime).toBe(1000)
      })
    })

    it('should collect all metrics together', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500 }
      const mockFCP = { name: 'first-contentful-paint', startTime: 1800 }
      const mockNavigation = {
        responseStart: 300,
        requestStart: 100,
        loadEventEnd: 5000,
        loadEventStart: 4000
      }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        if (type === 'paint') return [mockFCP]
        if (type === 'navigation') return [mockNavigation]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.lcp).toBe(2500)
        expect(result.current.metrics.fcp).toBe(1800)
        expect(result.current.metrics.ttfb).toBe(200)
        expect(result.current.metrics.loadTime).toBe(1000)
      })
    })
  })

  describe('rating system', () => {
    it('should rate LCP as good when <= 2500ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 2500)).toBe('good')
      expect(result.current.getRating('lcp', 2000)).toBe('good')
      expect(result.current.getRating('lcp', 1500)).toBe('good')
    })

    it('should rate LCP as needs-improvement when between 2500ms and 4000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 2501)).toBe('needs-improvement')
      expect(result.current.getRating('lcp', 3000)).toBe('needs-improvement')
      expect(result.current.getRating('lcp', 4000)).toBe('needs-improvement')
    })

    it('should rate LCP as poor when > 4000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', 4001)).toBe('poor')
      expect(result.current.getRating('lcp', 5000)).toBe('poor')
      expect(result.current.getRating('lcp', 10000)).toBe('poor')
    })

    it('should rate FCP as good when <= 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 1800)).toBe('good')
      expect(result.current.getRating('fcp', 1500)).toBe('good')
      expect(result.current.getRating('fcp', 1000)).toBe('good')
    })

    it('should rate FCP as needs-improvement when between 1800ms and 3000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 1801)).toBe('needs-improvement')
      expect(result.current.getRating('fcp', 2000)).toBe('needs-improvement')
      expect(result.current.getRating('fcp', 3000)).toBe('needs-improvement')
    })

    it('should rate FCP as poor when > 3000ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('fcp', 3001)).toBe('poor')
      expect(result.current.getRating('fcp', 4000)).toBe('poor')
      expect(result.current.getRating('fcp', 8000)).toBe('poor')
    })

    it('should rate TTFB as good when <= 800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 800)).toBe('good')
      expect(result.current.getRating('ttfb', 600)).toBe('good')
      expect(result.current.getRating('ttfb', 400)).toBe('good')
    })

    it('should rate TTFB as needs-improvement when between 800ms and 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 801)).toBe('needs-improvement')
      expect(result.current.getRating('ttfb', 1000)).toBe('needs-improvement')
      expect(result.current.getRating('ttfb', 1800)).toBe('needs-improvement')
    })

    it('should rate TTFB as poor when > 1800ms', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('ttfb', 1801)).toBe('poor')
      expect(result.current.getRating('ttfb', 2000)).toBe('poor')
      expect(result.current.getRating('ttfb', 5000)).toBe('poor')
    })

    it('should return unknown for undefined metrics', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('lcp', undefined)).toBe('unknown')
      expect(result.current.getRating('fcp', undefined)).toBe('unknown')
      expect(result.current.getRating('ttfb', undefined)).toBe('unknown')
    })

    it('should return unknown for unsupported metric types', () => {
      const { result } = renderHook(() => usePerformance())
      
      expect(result.current.getRating('cls' as any, 100)).toBe('unknown')
      expect(result.current.getRating('fid' as any, 100)).toBe('unknown')
    })
  })

  describe('helper rating functions', () => {
    it('should provide getLCPRating helper', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 2000 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getLCPRating()).toBe('good')
      })
    })

    it('should provide getFCPRating helper', async () => {
      const mockFCP = { name: 'first-contentful-paint', startTime: 2500 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'paint') return [mockFCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getFCPRating()).toBe('needs-improvement')
      })
    })

    it('should provide getTTFBRating helper', async () => {
      const mockNavigation = {
        responseStart: 2000,
        requestStart: 100,
        loadEventEnd: 5000,
        loadEventStart: 4000
      }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'navigation') return [mockNavigation]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.getTTFBRating()).toBe('poor')
      })
    })
  })

  describe('event handling', () => {
    it('should wait for load event if document not ready', () => {
      Object.defineProperty(document, 'readyState', { value: 'loading', writable: true })

      renderHook(() => usePerformance())

      expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function))
    })

    it('should handle page already loaded', async () => {
      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should cleanup event listener on unmount', () => {
      Object.defineProperty(document, 'readyState', { value: 'loading', writable: true })

      const { unmount } = renderHook(() => usePerformance())

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith('load', expect.any(Function))
    })
  })

  describe('analytics integration', () => {
    it('should send metrics to gtag if available', async () => {
      const mockGtag = vi.fn()
      ;(global.window as any).gtag = mockGtag

      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'LCP',
          value: 2500
        })
      })
    })

    it('should not crash if gtag is not available', async () => {
      ;(global.window as any).gtag = undefined

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      expect(() => {
        renderHook(() => usePerformance())
      }).not.toThrow()
    })

    it('should round LCP value for analytics', async () => {
      const mockGtag = vi.fn()
      ;(global.window as any).gtag = mockGtag

      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500.7 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'LCP',
          value: 2501
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should handle missing performance entries', async () => {
      ;(global.performance.getEntriesByType as any).mockReturnValue([])

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.lcp).toBeUndefined()
      expect(result.current.metrics.fcp).toBeUndefined()
      expect(result.current.metrics.ttfb).toBeUndefined()
    })

    it('should handle partial performance data', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.lcp).toBe(2500)
      })

      expect(result.current.metrics.fcp).toBeUndefined()
      expect(result.current.metrics.ttfb).toBeUndefined()
    })

    it('should handle zero metric values', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 0 }
      const mockFCP = { name: 'first-contentful-paint', startTime: 0 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        if (type === 'paint') return [mockFCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.lcp).toBe(0)
        expect(result.current.metrics.fcp).toBe(0)
      })
    })

    it('should handle very large metric values', async () => {
      const mockLCP = { name: 'largest-contentful-paint', startTime: 999999 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.lcp).toBe(999999)
        expect(result.current.getLCPRating()).toBe('poor')
      })
    })

    it('should handle negative navigation timing values gracefully', async () => {
      const mockNavigation = {
        responseStart: 100,
        requestStart: 200, // This would create negative TTFB
        loadEventEnd: 5000,
        loadEventStart: 4000
      }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'navigation') return [mockNavigation]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.metrics.ttfb).toBe(-100)
      })
    })
  })

  describe('console logging', () => {
    it('should log performance metrics to console', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockLCP = { name: 'largest-contentful-paint', startTime: 2500 }
      
      ;(global.performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') return [mockLCP]
        return []
      })

      Object.defineProperty(document, 'readyState', { value: 'complete', writable: true })

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Performance Metrics:',
          expect.objectContaining({
            lcp: 2500
          })
        )
      })

      consoleLogSpy.mockRestore()
    })
  })
})