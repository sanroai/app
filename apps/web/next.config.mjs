import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sanro/types', '@sanro/validation', '@sanro/config'],
  async redirects() {
    return [
      { source: '/app/learn', destination: '/app/library', permanent: false },
      // Flashcards were cut (2026-10-30). Old links land on the concept page with
      // Practice selected instead of a dead route.
      {
        source: '/app/flashcards/:conceptId',
        destination: '/app/learn/concepts/:conceptId?tab=practice',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1';
    const origin = new URL(api).origin;
    return [
      { source: '/api/v1/files/:path*', destination: `${origin}/api/v1/files/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
