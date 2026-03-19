import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/owner/', '/auth/'],
    },
    sitemap: 'https://kushmap.vercel.app/sitemap.xml',
  }
}
