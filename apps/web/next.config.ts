import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@keurzen/shared', '@keurzen/stores', '@keurzen/queries'],
};

export default nextConfig;
