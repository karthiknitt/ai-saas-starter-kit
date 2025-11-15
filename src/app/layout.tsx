import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import './globals.css';
import { cookies } from 'next/headers';
import { ActiveThemeProvider } from '@/components/active-theme';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

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
 * App root layout that renders the top-level HTML structure for every page.
 *
 * Reads the `active_theme` cookie to apply theme-related classes to the body, preconnects to CDN/image hosts, preloads a font and a video asset, and registers a service worker on window load. Wraps the application `children` with theme providers and global UI/monitoring components (PerformanceMonitor, Toaster, Analytics, SpeedInsights).
 *
 * @returns The root HTML element containing the document head and body with theme providers and application children.
 */
export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
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
          defaultTheme="dark"
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
  );
}
