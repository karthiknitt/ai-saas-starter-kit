'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useEffect } from 'react';

/**
 * Logs a formatted summary of web performance metrics (LCP, FCP, TTFB, and load time) to the console once metrics are available.
 *
 * The log is emitted only after the performance data is loaded and an LCP value exists.
 *
 * @returns Null — this component renders nothing visible.
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