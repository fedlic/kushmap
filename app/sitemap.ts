import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: shops } = await supabase
    .from('shops')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  const shopEntries: MetadataRoute.Sitemap = (shops ?? []).map((shop) => ({
    url: `https://kushmap.vercel.app/shops/${shop.id}`,
    lastModified: new Date(shop.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://kushmap.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...shopEntries,
  ]
}
