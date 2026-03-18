import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ShopDetailPage from '@/components/shop/ShopDetailPage'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shops')
    .select('name, description, city, address, shop_images(url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!shop) return { title: 'Shop not found — KUSHMAP' }

  const title = `${shop.name} — Cannabis Dispensary in ${shop.city} | KUSHMAP`
  const description = shop.description
    ? `${shop.description} Located at ${shop.address}.`
    : `Cannabis dispensary in ${shop.city}, Thailand. Find reviews, photos, and hours for ${shop.name} on KUSHMAP.`

  const primaryImage = (shop.shop_images as { url: string; is_primary: boolean }[] | null)
    ?.find(i => i.is_primary) ?? (shop.shop_images as { url: string; is_primary: boolean }[] | null)?.[0]
  const ogImage = primaryImage
    ? `https://kushmap.vercel.app/api/photo?url=${encodeURIComponent(primaryImage.url)}`
    : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://kushmap.vercel.app/shops/${params.id}`,
      siteName: 'KUSHMAP',
      ...(ogImage ? { images: [{ url: ogImage, width: 800, height: 600, alt: shop.name }] } : {}),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function ShopPage({ params }: Props) {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shops')
    .select('*, shop_images(url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!shop) notFound()

  return <ShopDetailPage shop={shop} />
}
