import { lostHostRedirectPattern } from "./src/lib/lostinseoul/domain";
import { withPayload } from "@payloadcms/next/withPayload";

import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next/types";

const withNextIntl = createNextIntlPlugin();
const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "172.30.1.71",
    "172.20.10.4",
    "sean-mbp.local",
    "seans-mac-mini.local"
  ],
  images: {
    // Dev-only optimization bypass.
    //   In dev, Payload populate emits absolute same-origin URLs like
    //   `http://localhost:3000/api/userMedia/...`. Next 16's optimizer
    //   refuses to fetch those (loopback IP → SSRF guard), and rewriting them
    //   to relative paths fails too because `/_next/image` treats relative
    //   URLs as `/public/` static assets — Payload-served `/api/...` paths
    //   404. Bandwidth is irrelevant on localhost, so just skip the optimizer
    //   in dev. Production keeps full AVIF/WebP/srcSet via the standard path.
    unoptimized: process.env.NODE_ENV !== "production",
    // AVIF first (best compression), WebP fallback. Browsers without either
    // get the original — Next.js content-negotiates per request.
    formats: ["image/avif", "image/webp"],
    // Tuned to project breakpoints (sm 640, md 768, lg 1024, xl 1280, 2xl 1536,
    // 3xl 1920) plus 2560 for retina at the editorial column width
    // (max-w-7xl = 1280px × 2). 750/828/1080 cover common mobile DPRs.
    deviceSizes: [640, 750, 828, 1080, 1280, 1536, 1920, 2560],
    // Whitelist qualities used in the codebase. Next 16 enforces this list
    // when set. 75 is the framework default; 100 is used in some admin
    // previews (coverClient.tsx, ImageBlockComponent.tsx).
    qualities: [50, 75, 100],
    // Cache optimized variants on disk for one year. Originals are
    // content-addressed (MD5-prefixed filenames), so the cache key is stable.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      ...[
        NEXT_PUBLIC_SERVER_URL,
        "https://lh3.googleusercontent.com",
        "https://images.unsplash.com"
      ].map((item) => {
        const url = new URL(item);
        return {
          ...url,
          hostname: url.hostname,
          protocol: url.protocol.replace(":", "")
        };
      })
    ]
  },
  turbopack: {
    rules: {
      "*.{glsl,vs,fs,vert,frag}": {
        loaders: ["raw-loader"],
        as: "*.js"
      },
      "*.{ttf,otf}": {
        loaders: ["raw-loader"],
        as: "*.js"
      }
    }
  },
  experimental: {
    typedEnv: true,
    serverActions: {
      bodySizeLimit: "2.5mb"
    }
  },
  // sharp: native binary, cannot be bundled — must be external.
  // pdfmake: uses dynamic requires internally that break bundling.
  serverExternalPackages: ["pdfmake", "sharp"],
  async headers() {
    // Static security headers applied to every response. Tightening to a
    // nonce-based CSP is deferred — the editorial reading surface uses inline
    // styles + dynamic imports + WebGL shaders that need careful per-page
    // policy work. Track in TYPE_DEBT.md as a post-launch item.
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload"
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin"
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()"
      },
      { key: "X-DNS-Prefetch-Control", value: "on" }
    ];
    return [
      {
        // Apply to everything — including /api routes and /vault.
        source: "/:path*",
        headers: securityHeaders
      },
      {
        // Guest order lookup may carry a secret in the query string.
        // Next uses the last matching rule for each header key.
        source: "/api/lost/orders",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }]
      }
    ];
  },
  typescript: {
    // Intentional ship switch. See readmes/TYPE_DEBT.md for the backlog of
    // ~700 errors being paid down post-launch. tsc still runs in CI for the
    // curated set (main tsconfig's `exclude` list).
    ignoreBuildErrors: true
  },
  webpack: (config, { isServer, webpack, dev }) => {
    if (dev) {
      const existing = Array.isArray(config.watchOptions?.ignored)
        ? config.watchOptions.ignored
        : config.watchOptions?.ignored
          ? [config.watchOptions.ignored]
          : [];
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...existing,
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/.attic/**",
          "**/reference/**",
          "**/src/app/(payload)/vault/importMap.js",
          "**/src/types/payload-types.ts"
        ].filter((p) => typeof p === "string" && p.length > 0)
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias
    };
    config.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"]
    };
    config.module.rules.push({
      test: /\.glsl$|\.frag$|\.vert$/i,
      type: "asset/source"
    });
    config.module.rules.push({
      test: /\.ttf$|\.otf$/i,
      type: "asset/source"
    });
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/
      })
    );
    return config;
  },
  sassOptions: { includePaths: ["src", "src/app/(payload)"] },
  reactStrictMode: true,

  cacheComponents: true,

  async redirects() {
    return [
      {
        destination: "/ie-incompatible.html",
        has: [
          {
            type: "header",
            key: "user-agent",
            value: "(.*Trident.*)" // all ie browsers
          }
        ],
        permanent: false,
        source: "/:path((?!ie-incompatible.html$).*)" // all pages except the incompatibility page
      },
      // Settings rebuild: /me/account/* now lives under /me/settings/*.
      {
        source: "/me/account",
        destination: "/me/settings/account",
        permanent: true
      },
      {
        source: "/me/saved",
        destination: "/me/library/saved",
        permanent: true
      },
      {
        source: "/me/saved/:path*",
        destination: "/me/library/saved/:path*",
        permanent: true
      },
      {
        source: "/me/lists",
        destination: "/me/library/lists",
        permanent: true
      },
      {
        source: "/me/lists/:path*",
        destination: "/me/library/lists/:path*",
        permanent: true
      },
      {
        source: "/me/notifications",
        destination: "/me/inbox",
        permanent: true
      },
      {
        source: "/me/notifications/:path*",
        destination: "/me/inbox/:path*",
        permanent: true
      },
      {
        source: "/auth/sign-in",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/sign-in",
        permanent: false
      },
      {
        source: "/auth/sign-up",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/sign-up",
        permanent: false
      },
      {
        source: "/auth/forgot-password",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/forgot-password",
        permanent: false
      },
      {
        source: "/auth/reset-password",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/reset-password",
        permanent: false
      },
      {
        source: "/auth/two-factor",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/two-factor",
        permanent: false
      },
      {
        source: "/auth/:path*",
        missing: [{ type: "host", value: lostHostRedirectPattern() }],
        destination: "/sign-in",
        permanent: false
      }
    ];
  },
  async rewrites() {
    return [
      // Vanity URLs: /@user/content-type/slug → internal route
      // Order matters — specific rewrites before the catch-all
      {
        source: "/@:user/essays/:slug",
        destination: "/essays/:slug"
      },
      {
        source: "/@:user/surf/:slug",
        destination: "/surf/:slug"
      },
      {
        source: "/@:user/lists/:hashId",
        destination: "/lists/:user/:hashId"
      },
      // Catch-all: /@user/anything → /users/user/anything
      {
        source: "/@:user/:path*",
        destination: "/users/:user/:path*"
      },
      {
        source: "/me",
        destination: "/me/settings/profile"
      }
    ];
  },
  transpilePackages: ["@payloadcms/plugin-ecommerce"],
  output: "standalone"
};

export default withNextIntl(
  withPayload(nextConfig, { devBundleServerPackages: false })
);
