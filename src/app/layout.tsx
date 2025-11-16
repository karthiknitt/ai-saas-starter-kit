import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cookies } from 'next/headers';
import { ActiveThemeProvider } from '@/components/active-theme';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ),
  title: {
    default: 'NextJS Starter Kit - AI SaaS Template',
    template: '%s | NextJS Starter Kit',
  },
  description:
    'Production-ready AI SaaS starter kit built with Next.js 16, featuring authentication, billing, admin dashboard, and AI chat capabilities.',
  keywords: [
    'nextjs',
    'ai saas',
    'starter kit',
    'template',
    'authentication',
    'billing',
    'dashboard',
    'ai chat',
  ],
  authors: [{ name: 'NextJS Starter Kit' }],
  creator: 'NextJS Starter Kit',
  publisher: 'NextJS Starter Kit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'NextJS Starter Kit',
    title: 'NextJS Starter Kit - AI SaaS Template',
    description:
      'Production-ready AI SaaS starter kit built with Next.js 16, featuring authentication, billing, admin dashboard, and AI chat capabilities.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NextJS Starter Kit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextJS Starter Kit - AI SaaS Template',
    description:
      'Production-ready AI SaaS starter kit built with Next.js 16, featuring authentication, billing, admin dashboard, and AI chat capabilities.',
    images: ['/og-image.png'],
    creator: '@nextjsstarter',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
  // Preload critical fonts
  other: {
    'font-preload':
      'https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/Geist-Sans.woff2',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
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
