import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['example.com'], // Add your trusted domains here
  },
};

export default nextConfig;
