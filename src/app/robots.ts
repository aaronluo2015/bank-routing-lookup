import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/ops/' },
      { userAgent: '*', disallow: '/api/' },
      { userAgent: 'GPTBot', disallow: '/' },
    ],
    sitemap: 'https://swiftcode.xin/sitemap.xml',
  };
}
