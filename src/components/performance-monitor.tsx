'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useEffect } from 'react';

/**
 * Logs client-side performance metrics to the console once metrics are available.
 *
 * When loading completes and an LCP value exists, writes a structured object containing
 * LCP (with rating), FCP (with rating or "Not available"), TTFB (with rating or "Not available"),
 * and LoadTime (or "Not available") to the console.
 *
 * @returns Null — the component renders nothing.
 */
export function PerformanceMonitor() {
  const { metrics, isLoading, getLCPRating, getFCPRating, getTTFBRating } =
    usePerformance();

  useEffect(() => {
    if (!isLoading && metrics.lcp) {
      console.log('🚀 Performance Metrics:', {
        LCP: `${metrics.lcp.toFixed(2)}ms (${getLCPRating()})`,
        FCP: metrics.fcp
          ? `${metrics.fcp.toFixed(2)}ms (${getFCPRating()})`
          : 'Not available',
        TTFB: metrics.ttfb
          ? `${metrics.ttfb.toFixed(2)}ms (${getTTFBRating()})`
          : 'Not available',
        LoadTime: metrics.loadTime
          ? `${metrics.loadTime.toFixed(2)}ms`
          : 'Not available',
      });
    }
  }, [metrics, isLoading, getLCPRating, getFCPRating, getTTFBRating]);

  // This component doesn't render anything visible
  return null;
}