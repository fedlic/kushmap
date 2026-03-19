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
  shop_images?: { url: string; is_primary: boolean }[]
  smoking_area?: boolean
  english_staff?: boolean
  delivery?: boolean
  card_payment?: boolean
  wifi?: boolean
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
  category?: 'flower' | 'oil' | 'edible' | 'joint' | 'cbd'
  strain_type?: 'indica' | 'sativa' | 'hybrid' | 'cbd'
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

export interface GoogleReview {
  id: string
  shop_id: string
  google_place_id: string
  author_name: string | null
  rating: number | null
  text_en: string | null
  text_ja: string | null
  text_th: string | null
  original_language: string | null
  published_at: string | null
  created_at: string
}

export type ReviewLang = 'en' | 'ja' | 'th'

export type FilterType = 'all' | 'sativa' | 'indica' | 'hybrid' | 'open' | 'top_rated'
