'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Wrapper component for the home page that applies landing-page specific styling
 * while staying in sync with the active theme (user preference or system fallback).
 */
export function HomePageWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    return 'light';
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <div data-theme={theme} className="home-page-wrapper">
      {children}
    </div>
  );
}
