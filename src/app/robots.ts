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
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
