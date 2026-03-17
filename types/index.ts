export interface Shop {
  id: string
  name: string
  name_th?: string
  description?: string
  address: string
  city: string
  lat: number
  lng: number
  phone?: string
  website?: string
  instagram?: string
  opening_hours?: Record<string, string>
  price_range?: 1 | 2 | 3
  is_verified: boolean
  is_premium: boolean
  created_at: string
}

export interface ShopImage {
  id: string
  shop_id: string
  url: string
  is_primary: boolean
  created_at: string
}

export interface Product {
  id: string
  shop_id: string
  name: string
  strain_type?: 'indica' | 'sativa' | 'hybrid'
  thc_percent?: number
  price_thb?: number
  in_stock: boolean
  created_at: string
}

export interface Review {
  id: string
  shop_id: string
  user_id: string
  rating: 1 | 2 | 3 | 4 | 5
  body?: string
  is_flagged: boolean
  created_at: string
}

export interface Bookmark {
  user_id: string
  shop_id: string
  created_at: string
}

export interface ShopOwner {
  shop_id: string
  user_id: string
  plan: 'free' | 'premium'
  plan_expires_at?: string
}

export type FilterType = 'all' | 'sativa' | 'indica' | 'hybrid' | 'open' | 'top_rated'
