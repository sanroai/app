import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/login', '/register'],
      },
    ],
    sitemap: 'https://sanroai.com/sitemap.xml',
  };
}
