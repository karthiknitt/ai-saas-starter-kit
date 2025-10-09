'use client';

import { useTheme } from 'next-themes';

/**
 * Wrapper component for the home page that applies landing-page specific styling
 * while staying in sync with the active theme (user preference or system fallback).
 */
export function HomePageWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  // Return null until theme is resolved to avoid hydration mismatch
  if (!resolvedTheme) {
    return null;
  }

  return (
    <div data-theme={resolvedTheme} className="home-page-wrapper">
      {children}
    </div>
  );
}
