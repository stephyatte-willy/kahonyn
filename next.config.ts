import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    domains: [],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;