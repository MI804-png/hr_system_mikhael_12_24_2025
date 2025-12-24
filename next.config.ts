import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    turbopack: false,
  },
};

export default nextConfig;


