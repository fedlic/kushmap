import { createClient } from './client'
import type { Shop, Review } from '@/types'

export async function fetchMyShops(userId: string): Promise<Shop[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(*, shop_images(url, is_primary))')
    .eq('user_id', userId)
  if (error) { console.error(error.message); return [] }
  return (data ?? []).map((row: { shops: unknown }) => row.shops).filter(Boolean) as Shop[]
}

export async function claimShop(shopId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shop_owners')
    .insert({ shop_id: shopId, user_id: userId, plan: 'free' })
  return { error: error?.message }
}

export async function updateShop(
  shopId: string,
  updates: Partial<Pick<Shop, 'name' | 'description' | 'phone' | 'website' | 'instagram' | 'opening_hours' | 'price_range'>>
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('shops').update(updates).eq('id', shopId)
  return { error: error?.message }
}

export async function fetchShopReviewsForOwner(shopId: string): Promise<Review[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return (data ?? []) as Review[]
}

export async function searchShopsForClaim(query: string): Promise<Shop[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, city, address, lat, lng, is_verified, is_premium, price_range, created_at, is_verified, is_premium')
    .ilike('name', `%${query}%`)
    .limit(10)
  if (error) return []
  return (data ?? []) as Shop[]
}
