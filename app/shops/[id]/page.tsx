import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ShopDetailPage from '@/components/shop/ShopDetailPage'

export default async function ShopPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shops')
    .select('*, shop_images(url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!shop) notFound()

  return <ShopDetailPage shop={shop} />
}
