import type { MetadataRoute } from 'next';

/**
 * Generates robots.txt file for search engine crawlers
 * Following Next.js 16 App Router conventions
 *
 * @returns Robots configuration object
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/billing/',
          '/(auth)/',
          '/aichat/',
          '*.json$',
          '/_next/',
          '/private/',
        ],
      },
      // Allow search engines to crawl public pages
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/billing/',
          '/(auth)/',
          '/aichat/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
