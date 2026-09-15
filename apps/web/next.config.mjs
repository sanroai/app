/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sanro/types', '@sanro/validation', '@sanro/config'],
};

export default nextConfig;