import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@convex': path.join(__dirname, 'convex'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@convex': path.join(__dirname, 'convex'),
    },
  },
};

export default nextConfig;
