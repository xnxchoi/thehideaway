import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://hideawayseoul.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/vault/',
          '/api/',
          '/me/',
          '/prive/',
          '/admin-ba/',
          '/account/',
          '/dev/',
          '/dodo/',
          '/lexy/',
          // Day n Night surfaces render the 48h order password and
          // gift-claim tokens — keep them out of search caches even
          // though each page also carries metadata.robots noindex.
          '/day-n-night/my',
          '/day-n-night/claim/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
