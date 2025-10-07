'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  loadTime?: number;
}

/**
 * React hook that captures basic web performance metrics on page load and provides helpers to rate them.
 *
 * Captured metrics include Largest Contentful Paint (LCP), First Contentful Paint (FCP), Time To First Byte (TTFB), and total load time; the hook also exposes a loading flag while metrics are being collected and functions to map metric values to qualitative ratings.
 *
 * @returns An object containing:
 * - `metrics`: a PerformanceMetrics object with optional numeric fields (`lcp`, `fcp`, `ttfb`, `loadTime`, etc.).
 * - `isLoading`: `true` while the hook is waiting for the page load event, `false` after metrics have been captured.
 * - `getRating(metric, value?)`: returns `'good' | 'needs-improvement' | 'poor' | 'unknown'` for the specified metric, optionally using an explicit `value`.
 * - `getLCPRating()`: convenience wrapper for `getRating('lcp', metrics.lcp)`.
 * - `getFCPRating()`: convenience wrapper for `getRating('fcp', metrics.fcp)`.
 * - `getTTFBRating()`: convenience wrapper for `getRating('ttfb', metrics.ttfb)`.
 */
export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for page to load
    const handleLoad = () => {
      setIsLoading(false);

      // Collect performance metrics
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

      const newMetrics: PerformanceMetrics = {};

      // Largest Contentful Paint
      if (lcp) {
        newMetrics.lcp = lcp.startTime;
      }

      // First Contentful Paint
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      if (fcp) {
        newMetrics.fcp = fcp.startTime;
      }

      // Time to First Byte
      if (navigation) {
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart;
        newMetrics.loadTime =
          navigation.loadEventEnd - navigation.loadEventStart;
      }

      setMetrics(newMetrics);

      // Log metrics for debugging
      console.log('Performance Metrics:', newMetrics);

      // Send to analytics (if available)
      if (typeof window !== 'undefined') {
        const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
        if (gtag) {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(newMetrics.lcp || 0),
          });
        }
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  const getRating = (metric: keyof PerformanceMetrics, value?: number) => {
    const val = value || metrics[metric];
    if (!val) return 'unknown';

    switch (metric) {
      case 'lcp':
        return val <= 2500
          ? 'good'
          : val <= 4000
            ? 'needs-improvement'
            : 'poor';
      case 'fcp':
        return val <= 1800
          ? 'good'
          : val <= 3000
            ? 'needs-improvement'
            : 'poor';
      case 'ttfb':
        return val <= 800 ? 'good' : val <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  return {
    metrics,
    isLoading,
    getRating,
    // Helper functions for common metrics
    getLCPRating: () => getRating('lcp', metrics.lcp),
    getFCPRating: () => getRating('fcp', metrics.fcp),
    getTTFBRating: () => getRating('ttfb', metrics.ttfb),
  };
}