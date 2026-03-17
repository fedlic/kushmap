import { createClient } from './client'
import type { Shop, Product, Review } from '@/types'

const SHOP_SELECT = '*, shop_images(url, is_primary)'

export async function fetchNearbyShops(
  lat: number,
  lng: number,
  radiusKm = 10
): Promise<Shop[]> {
  const supabase = createClient()
  const delta = radiusKm / 111
  const { data, error } = await supabase
    .from('shops')
    .select(SHOP_SELECT)
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lng', lng - delta)
    .lte('lng', lng + delta)

  if (error) {
    console.error('fetchNearbyShops error:', error.message)
    return []
  }

  const shops = (data ?? []) as Shop[]
  return shops.sort((a, b) => {
    const da = Math.hypot(a.lat - lat, a.lng - lng)
    const db = Math.hypot(b.lat - lat, b.lng - lng)
    return da - db
  })
}

export async function searchShops(query: string): Promise<Shop[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shops')
    .select(SHOP_SELECT)
    .ilike('name', `%${query}%`)
    .limit(20)
  if (error) {
    console.error('searchShops error:', error.message)
    return []
  }
  return (data ?? []) as Shop[]
}

export async function fetchShop(id: string): Promise<Shop | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shops')
    .select(SHOP_SELECT)
    .eq('id', id)
    .single()
  if (error) {
    console.error('fetchShop error:', error.message)
    return null
  }
  return data as Shop
}

export async function fetchShopProducts(shopId: string): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchShopProducts error:', error.message)
    return []
  }
  return (data ?? []) as Product[]
}

export async function fetchShopReviews(shopId: string): Promise<Review[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchShopReviews error:', error.message)
    return []
  }
  return (data ?? []) as Review[]
}

export async function submitReview(
  shopId: string,
  userId: string,
  rating: number,
  body?: string
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').insert({
    shop_id: shopId,
    user_id: userId,
    rating,
    body: body?.trim() || null,
    is_flagged: false,
  })
  return { error: error?.message }
}
