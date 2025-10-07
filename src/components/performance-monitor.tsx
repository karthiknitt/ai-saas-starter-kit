'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useEffect } from 'react';

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
