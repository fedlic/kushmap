'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { ArrowLeft, Phone, Globe, Instagram, MapPin, Star, Clock, Heart, Cigarette, Truck, CreditCard, Wifi } from 'lucide-react'
import type { Shop, Product, Review, GoogleReview, ReviewLang } from '@/types'
import { fetchShopProducts, fetchShopReviews, submitReview, fetchGoogleReviews, toggleBookmark } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import AuthModal from '@/components/auth/AuthModal'
import type { User } from '@supabase/supabase-js'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_LABELS: Record<string, string> = {
  sun: '日', mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土',
}

type ProductCategory = 'all' | 'flower' | 'oil' | 'edible' | 'joint' | 'cbd'
const PRODUCT_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all', label: '全て' },
  { id: 'flower', label: 'Flower' },
  { id: 'oil', label: 'Oil' },
  { id: 'edible', label: 'Edible' },
  { id: 'joint', label: 'Joint' },
  { id: 'cbd', label: 'CBD' },
]

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }))

  return (
    <div className="flex gap-6 items-center">
      <div className="text-center shrink-0">
        <div className="text-4xl font-black text-gray-900">{avg.toFixed(1)}</div>
        <StarDisplay rating={avg} />
        <div className="text-xs text-gray-400 mt-1">{reviews.length}件</div>
      </div>
      <div className="flex-1 space-y-1">
        {breakdown.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-4">{n}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-gray-400 w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpeningHoursTable({ hours }: { hours: Record<string, string> }) {
  const todayKey = DAY_KEYS[new Date().getDay()]
  return (
    <div className="space-y-1">
      {DAY_KEYS.map((key) => {
        const val = hours[key]
        const isToday = key === todayKey
        return (
          <div
            key={key}
            className={`flex gap-3 text-sm ${isToday ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
          >
            <span className="w-5 shrink-0">{DAY_LABELS[key]}</span>
            <span>{val ?? '—'}</span>
            {isToday && val && (
              <span className="text-xs text-green-600 font-normal">本日</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StrainBadge({ type }: { type?: string }) {
  if (!type) return null
  const map: Record<string, string> = {
    sativa: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    indica: 'bg-purple-50 text-purple-700 border-purple-200',
    hybrid: 'bg-green-50 text-green-700 border-green-200',
    cbd: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <Badge className={`text-[10px] px-1.5 py-0 h-4 ${map[type] ?? ''}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  )
}

function AmenitiesSection({ shop }: { shop: Shop }) {
  const amenities = [
    { key: 'smoking_area', icon: <Cigarette className="w-4 h-4" />, label: '喫煙スペース', value: shop.smoking_area },
    { key: 'english_staff', icon: <Globe className="w-4 h-4" />, label: '英語対応スタッフ', value: shop.english_staff },
    { key: 'delivery', icon: <Truck className="w-4 h-4" />, label: 'デリバリー可', value: shop.delivery },
    { key: 'card_payment', icon: <CreditCard className="w-4 h-4" />, label: 'カード払いOK', value: shop.card_payment },
    { key: 'wifi', icon: <Wifi className="w-4 h-4" />, label: 'Wi-Fi あり', value: shop.wifi },
  ]

  const hasAny = amenities.some(a => a.value)
  if (!hasAny) return null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-3">店舗設備</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {amenities.map((a) => (
          <div
            key={a.key}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              a.value ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
            }`}
          >
            <span>{a.icon}</span>
            <span>{a.label}</span>
            {a.value ? (
              <span className="ml-auto text-green-600 text-xs font-medium">あり</span>
            ) : (
              <span className="ml-auto text-gray-300 text-xs">なし</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ShopDetailPage({ shop }: { shop: Shop }) {
  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([])
  const [reviewLang, setReviewLang] = useState<ReviewLang>('en')
  const [user, setUser] = useState<User | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [productCategory, setProductCategory] = useState<ProductCategory>('all')

  const supabase = createClient()
  const photos = shop.shop_images?.map((i) => i.url) ?? []

  useEffect(() => {
    fetchShopProducts(shop.id).then(setProducts)
    fetchShopReviews(shop.id).then(setReviews)
    fetchGoogleReviews(shop.id).then(setGoogleReviews)
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: bm } = await supabase.from('bookmarks').select('shop_id').eq('shop_id', shop.id).eq('user_id', data.user.id).maybeSingle()
        setIsBookmarked(!!bm)
      }
    })
  }, [shop.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setShowAuth(true); return }
    if (!reviewRating) { setSubmitError('星を選択してください'); return }
    setSubmitting(true)
    setSubmitError('')
    const { error } = await submitReview(shop.id, user.id, reviewRating, reviewBody)
    if (error) {
      setSubmitError(error)
    } else {
      setSubmitted(true)
      setReviewRating(0)
      setReviewBody('')
      const updated = await fetchShopReviews(shop.id)
      setReviews(updated)
    }
    setSubmitting(false)
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`

  const filteredProducts = useMemo(() => {
    if (productCategory === 'all') return products
    return products.filter(p => p.category === productCategory)
  }, [products, productCategory])

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description ?? `Cannabis dispensary in ${shop.city}, Thailand`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: shop.city,
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: shop.lat,
      longitude: shop.lng,
    },
    ...(shop.phone ? { telephone: shop.phone } : {}),
    ...(shop.website ? { url: shop.website } : {}),
    ...(avgRating > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
      },
    } : {}),
    priceRange: shop.price_range === 1 ? '$' : shop.price_range === 2 ? '$$' : '$$$',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />

      <Script
        id="shop-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-medium text-gray-900 truncate">{shop.name}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-video">
          {photos.length > 0 ? (
            <>
              <Image
                src={`https://kushmap.vercel.app/api/photo?url=${encodeURIComponent(photos[photoIdx])}`}
                alt={shop.name}
                fill
                priority
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg=="
                unoptimized
              />
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === photoIdx ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white"
                  >‹</button>
                  <button
                    onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white"
                  >›</button>
                </>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-6xl font-black text-white ${
              shop.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-green-500 to-green-700'
            }`}>
              {shop.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Header info */}
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-gray-900">{shop.name}</h1>
                {shop.is_verified && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">認証済み</Badge>
                )}
                {shop.is_premium && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">★ Premium</Badge>
                )}
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarDisplay rating={avgRating} />
                  <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({reviews.length}件)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{shop.price_range === 1 ? '$' : shop.price_range === 2 ? '$$' : '$$$'}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {shop.city}
                </span>
              </div>
            </div>
          </div>

          {shop.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{shop.description}</p>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={async () => {
                if (!user) { setShowAuth(true); return }
                const next = await toggleBookmark(shop.id, user.id)
                setIsBookmarked(next)
              }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isBookmarked ? 'bg-red-50 text-red-500 border-red-200' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-red-500' : ''}`} />
              {isBookmarked ? 'ブックマーク済み' : 'ブックマーク'}
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              Googleマップで開く
            </a>
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {shop.phone}
              </a>
            )}
            {shop.website && (
              <a
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                ウェブサイト
              </a>
            )}
            {shop.instagram && (
              <a
                href={`https://instagram.com/${shop.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-gray-500 pt-1">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{shop.address}</span>
          </div>
        </div>

        {/* Amenities */}
        <AmenitiesSection shop={shop} />

        {/* Opening hours */}
        {shop.opening_hours && Object.keys(shop.opening_hours).length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              営業時間
            </h2>
            <OpeningHoursTable hours={shop.opening_hours} />
          </div>
        )}

        {/* Products / Menu */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">メニュー</h2>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4">
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id).length
                if (cat.id !== 'all' && count === 0) return null
                return (
                  <button
                    key={cat.id}
                    onClick={() => setProductCategory(cat.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                      productCategory === cat.id
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((p) => (
                <div key={p.id} className={`flex items-center justify-between border rounded-xl p-3 ${p.in_stock ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      <StrainBadge type={p.strain_type} />
                    </div>
                    <div className="flex items-center gap-2">
                      {p.thc_percent != null && (
                        <span className="text-xs text-gray-500">THC {p.thc_percent}%</span>
                      )}
                      {!p.in_stock && (
                        <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0 h-4">
                          売切れ
                        </Badge>
                      )}
                    </div>
                  </div>
                  {p.price_thb != null && (
                    <span className="text-sm font-bold text-green-700">{p.price_thb.toLocaleString()} THB</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Reviews section */}
        {googleReviews.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-base">G</span>
                Google レビュー
                <span className="text-xs text-gray-400 font-normal">({googleReviews.length}件)</span>
              </h2>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                {(['en', 'ja', 'th'] as ReviewLang[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setReviewLang(lang)}
                    className={`px-2.5 py-1 transition-colors ${reviewLang === lang ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {lang === 'en' ? 'EN' : lang === 'ja' ? 'JA' : 'TH'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {googleReviews.map((r) => {
                const text = reviewLang === 'ja' ? (r.text_ja ?? r.text_en) : reviewLang === 'th' ? (r.text_th ?? r.text_en) : r.text_en
                return (
                  <div key={r.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {r.author_name?.charAt(0)?.toUpperCase() ?? 'G'}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{r.author_name}</span>
                      {r.rating && <StarDisplay rating={r.rating} />}
                      {r.published_at && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(r.published_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                    {text && <p className="text-sm text-gray-600 pl-9 leading-relaxed">{text}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">レビュー</h2>

          {/* Rating breakdown */}
          {reviews.length > 0 && (
            <div className="mb-5 pb-5 border-b border-gray-100">
              <RatingBreakdown reviews={reviews} />
            </div>
          )}

          {/* Write review */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">レビューを書く</h3>
            {submitted ? (
              <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm">
                ✓ レビューを投稿しました。ありがとうございます！
              </div>
            ) : !user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                ログインしてレビューを投稿する
              </button>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="ショップについてのコメント（任意）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? '投稿中...' : '投稿する'}
                </button>
              </form>
            )}
          </div>

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">まだレビューがありません</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                      {r.user_id.charAt(0).toUpperCase()}
                    </div>
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(r.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-gray-600 pl-9">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
