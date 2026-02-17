// frontend/next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // ← Add any of your existing Next.js config options here (e.g., images, env, etc.)
  // For example:
  // images: { domains: ['example.com'] },
  // env: { CUSTOM_VAR: process.env.CUSTOM_VAR },

  turbopack: {
    root: __dirname, // Explicitly set the project root to the current 'frontend' directory
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*', // Proxy to backend
      },
    ];
  },
};

export default nextConfig;