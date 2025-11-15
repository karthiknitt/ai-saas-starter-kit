import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitor } from '@/components/performance-monitor';

// Mock the usePerformance hook
const mockUsePerformance = vi.fn();
vi.mock('@/hooks/use-performance', () => ({
  usePerformance: () => mockUsePerformance(),
}));

// Mock console.log to capture logs
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    mockUsePerformance.mockReturnValue({
      metrics: {},
      isLoading: false,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    // Component should render without errors (it renders null)
    expect(document.body).toBeInTheDocument();
  });

  it('should log performance metrics when LCP is available and not loading', () => {
    const mockMetrics = {
      lcp: 1500,
      fcp: 800,
      ttfb: 100,
      loadTime: 2000,
    };

    mockUsePerformance.mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Performance Metrics:', {
      LCP: '1500.00ms (good)',
      FCP: '800.00ms (good)',
      TTFB: '100.00ms (good)',
      LoadTime: '2000.00ms',
    });
  });

  it('should not log when still loading', () => {
    mockUsePerformance.mockReturnValue({
      metrics: { lcp: 1500 },
      isLoading: true,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should not log when LCP is not available', () => {
    mockUsePerformance.mockReturnValue({
      metrics: { fcp: 800, ttfb: 100 },
      isLoading: false,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle missing optional metrics', () => {
    mockUsePerformance.mockReturnValue({
      metrics: { lcp: 1500 }, // Only LCP available
      isLoading: false,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Performance Metrics:', {
      LCP: '1500.00ms (good)',
      FCP: 'Not available',
      TTFB: 'Not available',
      LoadTime: 'Not available',
    });
  });

  it('should handle zero values correctly', () => {
    mockUsePerformance.mockReturnValue({
      metrics: { lcp: 0, fcp: 0, ttfb: 0, loadTime: 0 },
      isLoading: false,
      getLCPRating: () => 'good',
      getFCPRating: () => 'good',
      getTTFBRating: () => 'good',
    });

    render(<PerformanceMonitor />);

    // When LCP is 0, the condition `!isLoading && metrics.lcp` is false, so no logging occurs
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle different rating values', () => {
    mockUsePerformance.mockReturnValue({
      metrics: { lcp: 5000, fcp: 3000, ttfb: 800 },
      isLoading: false,
      getLCPRating: () => 'poor',
      getFCPRating: () => 'needs-improvement',
      getTTFBRating: () => 'poor',
    });

    render(<PerformanceMonitor />);

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Performance Metrics:', {
      LCP: '5000.00ms (poor)',
      FCP: '3000.00ms (needs-improvement)',
      TTFB: '800.00ms (poor)',
      LoadTime: 'Not available',
    });
  });
});
