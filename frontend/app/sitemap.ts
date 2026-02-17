// frontend/app/sitemap.ts
import { MetadataRoute } from 'next';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forks-feedback.com';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Define static routes
  const staticRoutes = [
    '',
    '/about',
    '/support',
    '/privacy',
    '/terms',
    '/login',
    '/register',
    '/music',
    '/meals',
  ].map((route) => ({
    url: `${FRONTEND_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Fetch all venue IDs for dynamic routes
  let venueRoutes: any[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/venues/ids`);
    if (response.ok) {
      const ids = await response.json();
      venueRoutes = ids.map((id: number) => ({
        url: `${FRONTEND_URL}/venues/${id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch venue IDs for sitemap:', error);
  }

  return [...staticRoutes, ...venueRoutes];
}
