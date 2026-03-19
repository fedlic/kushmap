import { createClient } from './client'
import type { Shop, Review } from '@/types'

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

  const [shops, reviews, bookmarks, hidden, flagged] = await Promise.all([
    supabase.from('shops').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('bookmarks').select('user_id', { count: 'exact', head: true }),
    supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_hidden', true),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
  ])

  // Top cities
  const { data: cityData } = await supabase
    .from('shops')
    .select('city')
  const cityMap: Record<string, number> = {}
  ;(cityData ?? []).forEach((s: { city: string }) => {
    cityMap[s.city] = (cityMap[s.city] || 0) + 1
  })
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

export async function fetchAllShops(
  page: number,
  search: string,
  filter: 'all' | 'hidden' | 'visible'
): Promise<{ shops: Shop[]; total: number }> {
  const supabase = createClient()
  const pageSize = 50
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('shops')
    .select('*, shop_images(url, is_primary)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (filter === 'hidden') {
    query = query.eq('is_hidden', true)
  } else if (filter === 'visible') {
    query = query.or('is_hidden.is.null,is_hidden.eq.false')
  }

  const { data, count } = await query
  return { shops: (data ?? []) as Shop[], total: count ?? 0 }
}

export async function toggleShopVisibility(shopId: string, hidden: boolean): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('shops').update({ is_hidden: hidden }).eq('id', shopId)
  return { error: error?.message }
}

export async function deleteShop(shopId: string): Promise<{ error?: string }> {
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
  const pageSize = 50
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reviews')
    .select('*, shops(name, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter === 'flagged') {
    query = query.eq('is_flagged', true)
  }

  const { data, count } = await query
  const reviews = (data ?? []).map((r: Record<string, unknown>) => {
    const shops = r.shops as { name: string; city: string } | null
    return {
      ...r,
      shop_name: shops?.name ?? 'Unknown',
      shop_city: shops?.city ?? '',
      shops: undefined,
    } as unknown as ReviewWithShop
  })

  return { reviews, total: count ?? 0 }
}

export async function deleteReview(reviewId: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  return { error: error?.message }
}

export async function toggleReviewFlag(reviewId: string, flagged: boolean): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').update({ is_flagged: flagged }).eq('id', reviewId)
  return { error: error?.message }
}
