import { withPayload } from "@payloadcms/next/withPayload";

import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next/types";

const withNextIntl = createNextIntlPlugin();
const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
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
  serverExternalPackages: ["pdfmake"],
  webpack: (config, { isServer, webpack }) => {
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

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true
  },
  cacheComponents: false,
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
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/@:user/essays/:slug",
        destination: "/essays/:slug"
      },
      {
        source: "/@:user/:path*",
        destination: "/users/:user/:path*"
      }
    ];
  },
  output: "standalone"
};

export default withNextIntl(
  withPayload(nextConfig, { devBundleServerPackages: false })
);
