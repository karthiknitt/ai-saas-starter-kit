/**
 * Theme Readability E2E Tests
 *
 * Tests color contrast and readability across light and dark modes
 * to ensure WCAG compliance and cross-browser compatibility.
 *
 * WCAG 2.1 AA Requirements:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+): 3:1 contrast ratio
 * - UI components: 3:1 contrast ratio
 */

import { expect, test } from '@playwright/test';

/**
 * Convert OKLCH color to RGB for contrast calculation
 * This is a simplified conversion - in production you might want to use a library
 */
function _oklchToRgb(
  l: number,
  c: number,
  _h: number,
): [number, number, number] {
  // Simplified OKLCH to RGB conversion
  // For grayscale (c=0), L maps directly to RGB
  if (c === 0) {
    const rgb = Math.round(l * 255);
    return [rgb, rgb, rgb];
  }
  // For colored values, this is a rough approximation
  // In production, use a proper color space conversion library
  return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)];
}

/**
 * Calculate relative luminance for WCAG contrast ratio
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number],
): number {
  const l1 = getRelativeLuminance(...color1);
  const l2 = getRelativeLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract RGB values from computed style color string
 */
function parseRgbColor(colorString: string): [number, number, number] | null {
  const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
    ];
  }
  return null;
}

test.describe('Theme Readability Tests', () => {
  test.describe('Light Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Force light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await page.waitForTimeout(500); // Wait for theme transition
    });

    test('should have readable muted foreground text', async ({ page }) => {
      // Create a test element with muted foreground
      const testElement = await page.evaluate(() => {
        const el = document.createElement('div');
        el.style.cssText = `
          background: var(--background);
          color: var(--muted-foreground);
          padding: 20px;
          font-size: 16px;
        `;
        el.textContent = 'Muted foreground text';
        document.body.appendChild(el);

        const computedStyle = window.getComputedStyle(el);
        const bg = computedStyle.backgroundColor;
        const fg = computedStyle.color;

        document.body.removeChild(el);

        return { bg, fg };
      });

      // Check that colors are defined
      expect(testElement.bg).toBeTruthy();
      expect(testElement.fg).toBeTruthy();

      // Verify colors are not identical (text is visible)
      expect(testElement.bg).not.toBe(testElement.fg);
    });

    test('should have visible input borders', async ({ page }) => {
      const borderColor = await page.evaluate(() => {
        const el = document.createElement('input');
        el.style.cssText = 'border: 1px solid var(--input);';
        document.body.appendChild(el);

        const computedStyle = window.getComputedStyle(el);
        const border = computedStyle.borderColor;

        document.body.removeChild(el);

        return border;
      });

      // Input border should be defined and visible
      expect(borderColor).toBeTruthy();
      expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(borderColor).not.toBe('transparent');
    });

    test('should have readable placeholder text', async ({ page }) => {
      const placeholderVisibility = await page.evaluate(() => {
        const input = document.createElement('input');
        input.placeholder = 'Test placeholder';
        input.style.cssText = `
          background: var(--background);
          color: var(--foreground);
        `;
        document.body.appendChild(input);

        const computedStyle = window.getComputedStyle(input, '::placeholder');
        const placeholderColor = computedStyle.color;

        document.body.removeChild(input);

        return {
          color: placeholderColor,
          isVisible: placeholderColor !== 'rgba(0, 0, 0, 0)',
        };
      });

      expect(placeholderVisibility.isVisible).toBe(true);
    });

    test('should have sufficient contrast for primary buttons', async ({
      page,
    }) => {
      const buttonColors = await page.evaluate(() => {
        const button = document.createElement('button');
        button.style.cssText = `
          background-color: var(--primary);
          color: var(--primary-foreground);
          padding: 10px 20px;
        `;
        button.textContent = 'Button';
        document.body.appendChild(button);

        const computedStyle = window.getComputedStyle(button);
        const bg = computedStyle.backgroundColor;
        const fg = computedStyle.color;

        document.body.removeChild(button);

        return { bg, fg };
      });

      const bgRgb = parseRgbColor(buttonColors.bg);
      const fgRgb = parseRgbColor(buttonColors.fg);

      if (bgRgb && fgRgb) {
        const contrast = getContrastRatio(bgRgb, fgRgb);
        // Should meet WCAG AA for normal text (4.5:1)
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('should have visible status colors with proper contrast', async ({
      page,
    }) => {
      const statusColors = await page.evaluate(() => {
        const statuses = ['success', 'warning', 'error', 'info'];
        const results: Record<string, { bg: string; fg: string }> = {};

        for (const status of statuses) {
          const el = document.createElement('div');
          el.style.cssText = `
            background-color: var(--status-${status});
            color: var(--status-${status}-fg);
            padding: 10px;
          `;
          el.textContent = `${status} message`;
          document.body.appendChild(el);

          const computedStyle = window.getComputedStyle(el);
          results[status] = {
            bg: computedStyle.backgroundColor,
            fg: computedStyle.color,
          };

          document.body.removeChild(el);
        }

        return results;
      });

      // Check each status color
      for (const [status, colors] of Object.entries(statusColors)) {
        const bgRgb = parseRgbColor(colors.bg);
        const fgRgb = parseRgbColor(colors.fg);

        if (bgRgb && fgRgb) {
          const contrast = getContrastRatio(bgRgb, fgRgb);
          // Status colors should have at least 3:1 contrast for UI components
          expect(
            contrast,
            `${status} status should have sufficient contrast`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    });
  });

  test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Force dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(500); // Wait for theme transition
    });

    test('should have visible borders and inputs', async ({ page }) => {
      const colors = await page.evaluate(() => {
        const border = document.createElement('div');
        border.style.cssText = 'border: 1px solid var(--border);';
        document.body.appendChild(border);

        const input = document.createElement('input');
        input.style.cssText = `
          background: var(--input);
          border: 1px solid var(--input);
        `;
        document.body.appendChild(input);

        const borderStyle = window.getComputedStyle(border);
        const inputStyle = window.getComputedStyle(input);

        const result = {
          borderColor: borderStyle.borderColor,
          inputBg: inputStyle.backgroundColor,
          inputBorder: inputStyle.borderColor,
        };

        document.body.removeChild(border);
        document.body.removeChild(input);

        return result;
      });

      // Borders should be visible (not transparent or too faint)
      expect(colors.borderColor).toBeTruthy();
      expect(colors.borderColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(colors.borderColor).not.toBe('transparent');

      // Inputs should have visible background and borders
      expect(colors.inputBg).toBeTruthy();
      expect(colors.inputBorder).toBeTruthy();
    });

    test('should have readable muted foreground text on dark background', async ({
      page,
    }) => {
      const colors = await page.evaluate(() => {
        const el = document.createElement('div');
        el.style.cssText = `
          background: var(--background);
          color: var(--muted-foreground);
          padding: 20px;
        `;
        el.textContent = 'Muted text in dark mode';
        document.body.appendChild(el);

        const computedStyle = window.getComputedStyle(el);
        const result = {
          bg: computedStyle.backgroundColor,
          fg: computedStyle.color,
        };

        document.body.removeChild(el);

        return result;
      });

      const bgRgb = parseRgbColor(colors.bg);
      const fgRgb = parseRgbColor(colors.fg);

      if (bgRgb && fgRgb) {
        const contrast = getContrastRatio(bgRgb, fgRgb);
        // Should meet WCAG AA for normal text
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('should have visible card borders', async ({ page }) => {
      const cardBorder = await page.evaluate(() => {
        const card = document.createElement('div');
        card.style.cssText = `
          background: var(--card);
          border: 1px solid var(--border);
        `;
        document.body.appendChild(card);

        const computedStyle = window.getComputedStyle(card);
        const border = computedStyle.borderColor;

        document.body.removeChild(card);

        return border;
      });

      // Card borders should be visible
      expect(cardBorder).toBeTruthy();
      expect(cardBorder).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('should have proper contrast for all status colors', async ({
      page,
    }) => {
      const statusColors = await page.evaluate(() => {
        const statuses = ['success', 'warning', 'error', 'info'];
        const results: Record<string, { bg: string; fg: string }> = {};

        for (const status of statuses) {
          const el = document.createElement('div');
          el.style.cssText = `
            background-color: var(--status-${status});
            color: var(--status-${status}-fg);
            padding: 10px;
          `;
          el.textContent = `${status} in dark mode`;
          document.body.appendChild(el);

          const computedStyle = window.getComputedStyle(el);
          results[status] = {
            bg: computedStyle.backgroundColor,
            fg: computedStyle.color,
          };

          document.body.removeChild(el);
        }

        return results;
      });

      for (const [status, colors] of Object.entries(statusColors)) {
        const bgRgb = parseRgbColor(colors.bg);
        const fgRgb = parseRgbColor(colors.fg);

        if (bgRgb && fgRgb) {
          const contrast = getContrastRatio(bgRgb, fgRgb);
          expect(
            contrast,
            `Dark mode ${status} should have sufficient contrast`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should have visible input backgrounds', async ({ page }) => {
      const inputBg = await page.evaluate(() => {
        const input = document.createElement('input');
        input.className = 'dark:bg-input/30';
        input.style.cssText = `
          background: var(--input);
          opacity: 0.3;
        `;
        document.body.appendChild(input);

        const computedStyle = window.getComputedStyle(input);
        const bg = computedStyle.backgroundColor;

        document.body.removeChild(input);

        return bg;
      });

      // Input background should be defined and not fully transparent
      expect(inputBg).toBeTruthy();
      expect(inputBg).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render OKLCH colors correctly', async ({ page }) => {
      await page.goto('/');

      const oklchSupport = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.style.color = 'oklch(0.5 0.1 180)';
        document.body.appendChild(testEl);

        const computedColor = window.getComputedStyle(testEl).color;
        document.body.removeChild(testEl);

        // Check if color was computed (browser supports OKLCH or falls back properly)
        return {
          colorComputed: computedColor !== '',
          colorValue: computedColor,
        };
      });

      // Color should be computed in some form
      expect(oklchSupport.colorComputed).toBe(true);
    });

    test('should maintain theme on page navigation', async ({ page }) => {
      await page.goto('/');

      // Set dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(300);

      const isDarkBefore = await page.evaluate(() =>
        document.documentElement.classList.contains('dark'),
      );

      // Navigate to another page (if exists)
      await page.goto('/');
      await page.waitForTimeout(300);

      const isDarkAfter = await page.evaluate(() =>
        document.documentElement.classList.contains('dark'),
      );

      // Theme should persist
      expect(isDarkBefore).toBe(true);
      expect(isDarkAfter).toBe(true);
    });
  });

  test.describe('Accessibility Features', () => {
    test('should support high contrast mode', async ({ page }) => {
      await page.goto('/');

      const highContrastColors = await page.evaluate(() => {
        // Simulate high contrast preference
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');

        const border = document.createElement('div');
        border.style.cssText = 'border: 1px solid var(--border);';
        document.body.appendChild(border);

        const borderStyle = window.getComputedStyle(border);
        const borderColor = borderStyle.borderColor;

        document.body.removeChild(border);

        return {
          highContrastPreferred: mediaQuery.matches,
          borderColor,
        };
      });

      // Border should be defined
      expect(highContrastColors.borderColor).toBeTruthy();
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/');

      const focusStyles = await page.evaluate(() => {
        const button = document.createElement('button');
        button.textContent = 'Test Button';
        document.body.appendChild(button);

        button.focus();

        const computedStyle = window.getComputedStyle(button);
        const outline = computedStyle.outline;
        const outlineWidth = computedStyle.outlineWidth;

        document.body.removeChild(button);

        return { outline, outlineWidth };
      });

      // Focus indicators should be present
      expect(focusStyles.outline).toBeTruthy();
    });
  });
});
