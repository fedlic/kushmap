import { createClient } from './client'
import type { Shop } from '@/types'

export async function fetchNearbyShops(
  lat: number,
  lng: number,
  radiusKm = 10
): Promise<Shop[]> {
  const supabase = createClient()

  // Bounding box approximation (1 deg lat ≈ 111km)
  const delta = radiusKm / 111
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lng', lng - delta)
    .lte('lng', lng + delta)

  if (error) {
    console.error('fetchNearbyShops error:', error.message)
    return []
  }

  // Sort by distance client-side
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
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(20)
  if (error) {
    console.error('searchShops error:', error.message)
    return []
  }
  return (data ?? []) as Shop[]
}
