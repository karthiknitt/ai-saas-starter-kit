'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useEffect } from 'react';

/**
 * Client React component that logs structured performance metrics to the console once metrics are loaded and LCP is available.
 *
 * When metrics are ready, logs an object containing LCP (value with rating), FCP (value with rating or "Not available"), TTFB (value with rating or "Not available"), and LoadTime (value or "Not available").
 *
 * @returns `null` — the component renders nothing
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