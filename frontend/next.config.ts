// frontend/next.config.ts
import type { NextConfig } from 'next';
import path from 'path';  // Import path for safer __dirname handling

const nextConfig: NextConfig = {
  // ← Add any of your existing Next.js config options here (e.g., images, env, etc.)
  // For example:
  // images: { domains: ['example.com'] },
  // env: { CUSTOM_VAR: process.env.CUSTOM_VAR },

  turbopack: {
    // This explicitly sets the project root to the current 'frontend' directory
    // It prevents Next.js/Turbopack from detecting and prioritizing the parent lockfile
    root: path.join(__dirname, ''),
    // Alternative (simpler, works the same): root: __dirname,
  },
};

export default nextConfig;