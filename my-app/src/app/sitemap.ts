import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmit-rooms.vercel.app';
  const now = new Date();

  return [
    {
      url: `${baseUrl}/rooms`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
