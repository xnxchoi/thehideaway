import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://hideawayseoul.com'
  const payload = await getPayload({ config: configPromise })

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/essays`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/radio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/plans`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/the-team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/lostinseoul`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Dynamic posts
  const posts = await payload.find({
    collection: 'posts',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
  })

  const postEntries: MetadataRoute.Sitemap = posts.docs.map((post) => ({
    url: `${siteUrl}/essays/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic surf
  const surf = await payload.find({
    collection: 'surf',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
  })

  const surfEntries: MetadataRoute.Sitemap = surf.docs.map((item) => ({
    url: `${siteUrl}/surf/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic users
  const users = await payload.find({
    collection: 'users',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    where: {
      and: [
        { _status: { equals: 'published' } },
        { banned: { not_equals: true } },
      ],
    },
    select: { slug: true, updatedAt: true },
  })

  const userEntries: MetadataRoute.Sitemap = users.docs.map((user) => ({
    url: `${siteUrl}/@${user.slug}`,
    lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic tags
  const tags = await payload.find({
    collection: 'tags',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    select: { slug: true, updatedAt: true },
  })

  const tagEntries: MetadataRoute.Sitemap = tags.docs.map((tag) => ({
    url: `${siteUrl}/tagged/${tag.slug}`,
    lastModified: tag.updatedAt ? new Date(tag.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic CMS pages
  const pages = await payload.find({
    collection: 'pages',
    overrideAccess: true,
    limit: 0,
    pagination: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
  })

  const pageEntries: MetadataRoute.Sitemap = pages.docs.map((page) => ({
    url: `${siteUrl}/${page.slug}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    ...staticEntries,
    ...postEntries,
    ...surfEntries,
    ...userEntries,
    ...tagEntries,
    ...pageEntries,
  ]
}
