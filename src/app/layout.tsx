import type { Metadata } from 'next';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ActiveThemeProvider } from '@/components/active-theme';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'NextJS Starter Kit',
  description: 'Starter AI Saas Template',
};

export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <>
      <html lang="en" suppressHydrationWarning>
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
              {children}
              <Toaster />
            </ActiveThemeProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
