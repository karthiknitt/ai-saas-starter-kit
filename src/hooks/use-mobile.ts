/**
 * React hook for detecting mobile viewport sizes.
 *
 * This hook uses the `window.matchMedia` API to detect viewport changes
 * and determine if the current viewport is mobile-sized (< 768px).
 *
 * Features:
 * - Responds to viewport resize events
 * - Uses media query listener for efficiency
 * - Returns undefined initially (SSR-safe), then boolean
 * - Cleans up event listeners on unmount
 *
 * @module hooks/use-mobile
 * @example
 * ```typescript
 * import { useIsMobile } from '@/hooks/use-mobile';
 *
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileNav />
 *       ) : (
 *         <DesktopNav />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import * as React from 'react';

/**
 * Breakpoint width for mobile devices (in pixels).
 * Viewports smaller than this value are considered mobile.
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook that detects if the current viewport is mobile-sized.
 *
 * The hook initializes with `undefined` to handle SSR gracefully,
 * then updates to the actual mobile state after mounting.
 *
 * @returns {boolean} True if viewport width is less than 768px, false otherwise
 *
 * @example
 * ```typescript
 * const isMobile = useIsMobile();
 *
 * // Conditional rendering based on viewport
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 * ```
 *
 * @example
 * ```typescript
 * // Use with conditional styling
 * const buttonSize = useIsMobile() ? 'sm' : 'lg';
 * return <Button size={buttonSize}>Click me</Button>;
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
