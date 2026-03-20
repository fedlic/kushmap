import { createClient } from './client'
import type { Review } from '@/types'

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single()
  return !!data
}

export interface AdminStats {
  totalShops: number
  totalReviews: number
  totalBookmarks: number
  hiddenShops: number
  flaggedReviews: number
  topCities: { city: string; count: number }[]
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = createClient()

  const [shops, reviews, bookmarks, hidden, flagged, cityRes] = await Promise.all([
    supabase.from('shops').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('is_hidden', true),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('shops').select('city'),
  ])

  const cityMap: Record<string, number> = {}
  for (const s of (cityRes.data ?? []) as { city: string }[]) {
    cityMap[s.city] = (cityMap[s.city] || 0) + 1
  }
  const topCities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalShops: shops.count ?? 0,
    totalReviews: reviews.count ?? 0,
    totalBookmarks: bookmarks.count ?? 0,
    hiddenShops: hidden.count ?? 0,
    flaggedReviews: flagged.count ?? 0,
    topCities,
  }
}

export interface AdminShop {
  id: string
  name: string
  city: string
  is_verified: boolean
  is_premium: boolean
  is_hidden: boolean | null
  created_at: string
}

const PAGE_SIZE = 50

export async function fetchAllShops(
  page: number,
  search: string,
  filter: 'all' | 'hidden' | 'visible'
): Promise<{ shops: AdminShop[]; total: number }> {
  const supabase = createClient()
  const from = page * PAGE_SIZE

  let query = supabase
    .from('shops')
    .select('id, name, city, is_verified, is_premium, is_hidden, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (search) query = query.ilike('name', `%${search}%`)
  if (filter === 'hidden') query = query.eq('is_hidden', true)
  else if (filter === 'visible') query = query.or('is_hidden.is.null,is_hidden.eq.false')

  const { data, count } = await query
  return { shops: (data ?? []) as AdminShop[], total: count ?? 0 }
}

export async function toggleShopVisibility(shopId: string, hidden: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('shops').update({ is_hidden: hidden }).eq('id', shopId)
  return { error: error?.message }
}

export async function deleteShop(shopId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shops').delete().eq('id', shopId)
  return { error: error?.message }
}

export interface ReviewWithShop extends Review {
  shop_name: string
  shop_city: string
}

export async function fetchAllReviews(
  page: number,
  filter: 'all' | 'flagged'
): Promise<{ reviews: ReviewWithShop[]; total: number }> {
  const supabase = createClient()
  const from = page * PAGE_SIZE

  let query = supabase
    .from('reviews')
    .select('*, shops!inner(name, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (filter === 'flagged') query = query.eq('is_flagged', true)

  const { data, count } = await query
  const reviews = (data ?? []).map((r: Record<string, unknown>) => {
    const shop = r.shops as { name: string; city: string } | null
    return { ...r, shop_name: shop?.name ?? '', shop_city: shop?.city ?? '', shops: undefined } as unknown as ReviewWithShop
  })
  return { reviews, total: count ?? 0 }
}

export async function deleteReview(reviewId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  return { error: error?.message }
}

export async function toggleReviewFlag(reviewId: string, flagged: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').update({ is_flagged: flagged }).eq('id', reviewId)
  return { error: error?.message }
}

export { PAGE_SIZE }
