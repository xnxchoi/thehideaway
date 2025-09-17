const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  "https://hideawayseoul.com";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: [
    "/posts-sitemap.xml",
    "/pages-sitemap.xml",
    "/users-sitemap.xml",
    "/*",
    "/posts/*",
    "/users/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: "/vault/*",
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/pages-sitemap.xml`,
      `${SITE_URL}/posts-sitemap.xml`,
      `${SITE_URL}/users-sitemap.xml`,
    ],
  },
};
