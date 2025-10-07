import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ActiveThemeProvider } from '@/components/active-theme';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';
import { PerformanceMonitor } from '@/components/performance-monitor';

export const metadata: Metadata = {
  title: 'NextJS Starter Kit',
  description: 'Starter AI Saas Template',
  // Preload critical fonts
  other: {
    'font-preload':
      'https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/Geist-Sans.woff2',
  },
};

/**
 * Render the application's root HTML layout, applying theme state, performance monitoring, and analytics.
 *
 * Reads the `active_theme` cookie to apply theme-related classes to the document body, preconnects and preloads
 * critical assets in the head, injects a service worker registration script, and wraps content with theme and
 * performance providers plus toaster, analytics, and speed insights components.
 *
 * @returns The root HTML element tree for the application
 */
export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            rel="preconnect"
            href="https://cdn.jsdelivr.net"
            crossOrigin="anonymous"
          />
          <link
            rel="preconnect"
            href="https://ik.imagekit.io"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/Geist-Sans.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
            as="video"
            crossOrigin="anonymous"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then((registration) => {
                        console.log('Service Worker registered successfully:', registration);
                      })
                      .catch((error) => {
                        console.log('Service Worker registration failed:', error);
                      });
                  });
                }
              `,
            }}
          />
        </head>
        <body
          className={cn(
            'bg-background overscroll-none font-sans antialiased',
            activeThemeValue ? `theme-${activeThemeValue}` : '',
            isScaled ? 'theme-scaled' : '',
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              <PerformanceMonitor />
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </ActiveThemeProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}