import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://sanroai.com';

  const publicPages = [
    '',
    '/about',
    '/features',
    '/for-students',
    '/for-teachers',
    '/for-schools',
    '/for-parents',
    '/pricing',
    '/contact',
    '/download',
    '/privacy',
    '/terms',
  ];

  return publicPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));
}
