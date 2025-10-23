import { withPayload } from "@payloadcms/next/withPayload";
import redirects from "./redirects.js";

import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next/types";
import path from "path";
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
      }
    }
  },

  serverExternalPackages: ["pdfmake"],
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias
      // "@payloadcms/ui/elements/DocumentControls": path.resolve(
      //   __dirname,
      //   "src/payload/elements/DocumentControls"
      // )
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

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/
      })
    );
    return config;
  },
  eslint: { ignoreDuringBuilds: true },
  sassOptions: { includePaths: ["src"] },
  reactStrictMode: true,
  redirects,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true
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
