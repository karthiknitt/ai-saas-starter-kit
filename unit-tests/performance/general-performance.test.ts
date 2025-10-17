import { describe, it, expect, beforeEach, vi } from 'vitest';

// Performance testing utilities
const measurePerformance = (operation: () => void): number => {
  const startTime = performance.now();
  operation();
  const endTime = performance.now();
  return endTime - startTime;
};

const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: index,
    name: `Item ${index}`,
    description: `Description for item ${index}`,
    value: Math.floor(Math.random() * 1000),
    category: `Category ${index % 10}`,
    status: index % 2 === 0 ? 'active' : 'inactive',
    timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  }));
};

describe('General Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Dataset Operations', () => {
    it('should handle array operations on large datasets efficiently', () => {
      const dataset = generateLargeDataset(10000);

      const operation = () => {
        // Test filtering performance
        const filtered = dataset.filter(item => item.value > 500);

        // Test mapping performance
        const mapped = filtered.map(item => ({
          ...item,
          displayName: `${item.name} (${item.category})`
        }));

        // Test sorting performance
        return mapped.sort((a, b) => b.value - a.value);
      };

      const executionTime = measurePerformance(operation);

      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(200);
    });

    it('should handle object property access efficiently', () => {
      const dataset = generateLargeDataset(5000);

      const operation = () => {
        const result = dataset.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
        }));

        return result;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle string operations efficiently', () => {
      const dataset = generateLargeDataset(2000);

      const operation = () => {
        const result = dataset.map(item => {
          const upperName = item.name.toUpperCase();
          const category = item.category.toLowerCase();
          const combined = `${upperName}_${category}_${item.id}`;

          return {
            original: item.name,
            processed: combined,
            length: combined.length,
          };
        });

        return result;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        const dataset = generateLargeDataset(1000);
        const filtered = dataset.filter(item => item.value > 500);
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      const finalMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      if (finalMemory > 0) {
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    it('should handle large object creation efficiently', () => {
      const operation = () => {
        const largeObject = {
          data: generateLargeDataset(5000),
          metadata: {
            created: new Date(),
            version: '1.0.0',
            settings: {
              theme: 'dark',
              language: 'en',
              features: Array.from({ length: 100 }, (_, i) => `feature_${i}`)
            }
          },
          computed: {
            totalItems: 5000,
            categories: 10,
            averageValue: 500,
          }
        };

        return largeObject;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(400);
    });
  });

  describe('Algorithm Performance', () => {
    it('should handle search operations efficiently', () => {
      const dataset = generateLargeDataset(10000);

      const operation = () => {
        const searchTerm = 'Item 5000';
        const results = [];

        for (const item of dataset) {
          if (item.name.includes(searchTerm)) {
            results.push(item);
          }
        }

        return results;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(400);
    });

    it('should handle sorting operations efficiently', () => {
      const dataset = generateLargeDataset(5000);

      const operation = () => {
        // Test different sorting approaches
        const sortByName = [...dataset].sort((a, b) => a.name.localeCompare(b.name));
        const sortByValue = [...dataset].sort((a, b) => b.value - a.value);
        const sortByDate = [...dataset].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return { sortByName, sortByValue, sortByDate };
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(800);
    });

    it('should handle grouping operations efficiently', () => {
      const dataset = generateLargeDataset(3000);

      const operation = () => {
        const grouped = dataset.reduce((acc, item) => {
          const category = item.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as Record<string, typeof dataset>);

        return grouped;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(200);
    });
  });

  describe('Async Operations Performance', () => {
    it('should handle concurrent operations efficiently', async () => {
      const datasets = Array.from({ length: 5 }, () => generateLargeDataset(1000));

      const operation = async () => {
        const promises = datasets.map(async (dataset) => {
          return new Promise(resolve => {
            setTimeout(() => {
              const filtered = dataset.filter(item => item.value > 500);
              resolve(filtered.length);
            }, 10);
          });
        });

        const results = await Promise.all(promises);
        return results;
      };

      const startTime = performance.now();
      await operation();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle sequential async operations', async () => {
      const operation = async () => {
        const results = [];

        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 5));
          const dataset = generateLargeDataset(500);
          const filtered = dataset.filter(item => item.value > 250);
          results.push(filtered.length);
        }

        return results;
      };

      const startTime = performance.now();
      const results = await operation();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1200);
      expect(results).toHaveLength(10);
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme computational loads', () => {
      const operation = () => {
        let result = 0;

        // Heavy computational loop
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i) * Math.sin(i);
        }

        return result;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle large scale data transformations', () => {
      const operation = () => {
        const matrix = Array.from({ length: 100 }, () =>
          Array.from({ length: 100 }, () => Math.floor(Math.random() * 100))
        );

        // Matrix operations
        const transposed = matrix[0].map((_, colIndex) =>
          matrix.map(row => row[colIndex])
        );

        const flattened = matrix.flat();
        const sum = flattened.reduce((acc, val) => acc + val, 0);
        const average = sum / flattened.length;

        return { transposed, sum, average };
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(200);
    });

    it('should handle recursive operations efficiently', () => {
      const fibonacci = (n: number): number => {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      };

      const operation = () => {
        const results = [];
        for (let i = 0; i < 20; i++) {
          results.push(fibonacci(i));
        }
        return results;
      };

      const executionTime = measurePerformance(operation);
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should establish baseline performance metrics', () => {
      const benchmarks = {
        smallDataset: () => generateLargeDataset(100),
        mediumDataset: () => generateLargeDataset(1000),
        largeDataset: () => generateLargeDataset(5000),
      };

      const results = Object.entries(benchmarks).map(([name, fn]) => {
        const executionTime = measurePerformance(fn);
        return { name, executionTime };
      });

      // All benchmarks should complete within reasonable time
      results.forEach(({ executionTime }) => {
        expect(executionTime).toBeLessThan(200);
      });
    });

    it('should track performance regression indicators', () => {
      const dataset = generateLargeDataset(2000);

      const operations = [
        () => dataset.filter(item => item.value > 500),
        () => dataset.map(item => item.name.toUpperCase()),
        () => dataset.sort((a, b) => a.name.localeCompare(b.name)),
        () => dataset.reduce((acc, item) => acc + item.value, 0),
      ];

      const results = operations.map(operation => measurePerformance(operation));

      // All operations should be fast
      results.forEach(executionTime => {
        expect(executionTime).toBeLessThan(100);
      });
    });
  });
});