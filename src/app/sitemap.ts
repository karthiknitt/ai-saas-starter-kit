import type { MetadataRoute } from 'next';

/**
 * Generates sitemap.xml for search engines
 * Following Next.js 16 App Router conventions
 *
 * This sitemap includes all public-facing pages that should be indexed by search engines.
 * Private routes (admin, dashboard, billing, auth) are excluded.
 *
 * @returns Array of URL objects for the sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Add more public pages here as your application grows
    // Example:
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/pricing`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.9,
    // },
    // {
    //   url: `${baseUrl}/features`,
    //   lastModified: currentDate,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/blog`,
    //   lastModified: currentDate,
    //   changeFrequency: 'daily',
    //   priority: 0.7,
    // },

    // Dynamic routes can be added by fetching data from your database
    // Example for blog posts:
    // ...await getBlogPosts().then((posts) =>
    //   posts.map((post) => ({
    //     url: `${baseUrl}/blog/${post.slug}`,
    //     lastModified: post.updatedAt,
    //     changeFrequency: 'monthly' as const,
    //     priority: 0.6,
    //   }))
    // ),
  ];
}
