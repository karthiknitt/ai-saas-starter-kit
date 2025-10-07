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
        newMetrics.loadTime = navigation.loadEventEnd - navigation.startTime;
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
