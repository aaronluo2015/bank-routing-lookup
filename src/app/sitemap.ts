import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://swiftcode.xin';

  const pages = [
    { url: '', priority: 1.0 },
    { url: '/docs', priority: 0.8 },
    { url: '/register', priority: 0.7 },
    { url: '/about', priority: 0.5 },
    { url: '/privacy', priority: 0.3 },
    { url: '/terms', priority: 0.3 },
    { url: '/contact', priority: 0.4 },
  ];

  return pages.map(p => ({
    url: `${baseUrl}/${p.url}`.replace(/\/$/, ''),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: p.priority,
  }));
}
