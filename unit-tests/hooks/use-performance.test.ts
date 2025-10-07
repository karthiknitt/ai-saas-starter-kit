import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePerformance } from '@/hooks/use-performance'

describe('use-performance', () => {
  let mockPerformance: {
    getEntriesByType: ReturnType<typeof vi.fn>
  }
  let originalReadyState: string
  let mockGtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock performance API
    mockPerformance = {
      getEntriesByType: vi.fn(),
    }
    
    Object.defineProperty(global, 'performance', {
      writable: true,
      configurable: true,
      value: mockPerformance,
    })

    // Save original document.readyState
    originalReadyState = document.readyState

    // Mock gtag
    mockGtag = vi.fn()
    Object.defineProperty(window, 'gtag', {
      writable: true,
      configurable: true,
      value: mockGtag,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: originalReadyState,
    })
  })

  describe('usePerformance', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.metrics).toEqual({})
    })

    it('should collect LCP metric when available', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        if (type === 'paint') {
          return [{ name: 'first-contentful-paint', startTime: 500 }]
        }
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 1500 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.lcp).toBe(1500)
    })

    it('should collect FCP metric when available', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        if (type === 'paint') {
          return [{ name: 'first-contentful-paint', startTime: 800 }]
        }
        if (type === 'largest-contentful-paint') {
          return []
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.fcp).toBe(800)
    })

    it('should calculate TTFB from navigation timing', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 250,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        if (type === 'paint') {
          return []
        }
        if (type === 'largest-contentful-paint') {
          return []
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.ttfb).toBe(150) // 250 - 100
    })

    it('should calculate load time from navigation timing', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1200,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.loadTime).toBe(200) // 1200 - 1000
    })

    it('should handle missing metrics gracefully', async () => {
      mockPerformance.getEntriesByType.mockReturnValue([])

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics).toEqual({})
    })

    it('should wait for load event if document not ready', async () => {
      let loadHandler: (() => void) | null = null

      vi.spyOn(window, 'addEventListener')
        .mockImplementation((event: string, handler: EventListenerOrEventListenerObject) => {
          if (event === 'load') {
            loadHandler = handler as () => void
          }
        })

      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        if (type === 'paint') {
          return [{ name: 'first-contentful-paint', startTime: 500 }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'loading',
      })

      const { result } = renderHook(() => usePerformance())

      expect(result.current.isLoading).toBe(true)

      // Trigger the load event
      if (loadHandler) {
        loadHandler()
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.fcp).toBe(500)
    })
  })

  describe('getRating', () => {
    it('should rate LCP correctly', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getLCPRating()).toBe('good') // 2000ms is good
    })

    it('should rate LCP as needs-improvement', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 3000 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getLCPRating()).toBe('needs-improvement') // 3000ms
    })

    it('should rate LCP as poor', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 5000 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getLCPRating()).toBe('poor') // 5000ms
    })

    it('should rate FCP correctly', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'paint') {
          return [{ name: 'first-contentful-paint', startTime: 1500 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getFCPRating()).toBe('good')
    })

    it('should rate TTFB correctly', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 700,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getTTFBRating()).toBe('good') // 600ms
    })

    it('should return unknown rating when metric not available', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.getRating('lcp')).toBe('unknown')
      expect(result.current.getLCPRating()).toBe('unknown')
    })
  })

  describe('analytics integration', () => {
    it('should send metrics to gtag when available', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      renderHook(() => usePerformance())

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalled()
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: 2000,
      })
    })

    it('should not crash if gtag is not available', async () => {
      Object.defineProperty(window, 'gtag', {
        writable: true,
        configurable: true,
        value: undefined,
      })

      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]
        }
        if (type === 'navigation') {
          return [{
            requestStart: 100,
            responseStart: 200,
            loadEventStart: 1000,
            loadEventEnd: 1100,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      expect(() => {
        renderHook(() => usePerformance())
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle boundary values for LCP rating', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.getRating('lcp', 2500)).toBe('good')
      expect(result.current.getRating('lcp', 2501)).toBe('needs-improvement')
      expect(result.current.getRating('lcp', 4000)).toBe('needs-improvement')
      expect(result.current.getRating('lcp', 4001)).toBe('poor')
    })

    it('should handle boundary values for FCP rating', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.getRating('fcp', 1800)).toBe('good')
      expect(result.current.getRating('fcp', 1801)).toBe('needs-improvement')
      expect(result.current.getRating('fcp', 3000)).toBe('needs-improvement')
      expect(result.current.getRating('fcp', 3001)).toBe('poor')
    })

    it('should handle boundary values for TTFB rating', () => {
      const { result } = renderHook(() => usePerformance())

      expect(result.current.getRating('ttfb', 800)).toBe('good')
      expect(result.current.getRating('ttfb', 801)).toBe('needs-improvement')
      expect(result.current.getRating('ttfb', 1800)).toBe('needs-improvement')
      expect(result.current.getRating('ttfb', 1801)).toBe('poor')
    })

    it('should handle zero values', async () => {
      mockPerformance.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [{
            requestStart: 0,
            responseStart: 0,
            loadEventStart: 0,
            loadEventEnd: 0,
          }]
        }
        return []
      })

      Object.defineProperty(document, 'readyState', {
        writable: true,
        configurable: true,
        value: 'complete',
      })

      const { result } = renderHook(() => usePerformance())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.metrics.ttfb).toBe(0)
      expect(result.current.metrics.loadTime).toBe(0)
    })
  })
})