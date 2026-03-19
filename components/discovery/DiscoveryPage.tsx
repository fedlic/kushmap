'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, MapPin, LocateFixed, X, SlidersHorizontal, Clock, BadgeCheck, User, Map } from 'lucide-react'
import { fetchNearbyShops, searchShops, fetchBookmarkedShopIds, toggleBookmark } from '@/lib/supabase/queries'
import type { Shop } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import ShopListCard from './ShopListCard'
import AreaFilter, { type Area } from './AreaFilter'
import MapErrorBoundary from './MapErrorBoundary'
import AuthModal from '@/components/auth/AuthModal'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapPanel = dynamic(() => import('./MapPanel'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>,
})

const BANGKOK = { lat: 13.7563, lng: 100.5018 }
const PAGE_SIZE = 20

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

type SortMode = 'distance' | 'newest'
type StrainFilter = 'all' | 'indica' | 'sativa' | 'hybrid' | 'cbd'
type PriceFilter = 'all' | 1 | 2 | 3

function calcKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isOpenNow(hours?: Record<string, string>): boolean {
  if (!hours) return false
  const todayKey = DAY_KEYS[new Date().getDay()]
  const val = hours[todayKey]
  if (!val) return false
  const [open, close] = val.split('-').map(t => {
    const [h, m] = t.trim().split(':').map(Number)
    return h * 60 + (m || 0)
  })
  if (open === undefined || close === undefined) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  return close > open ? cur >= open && cur < close : cur >= open || cur < close
}

export default function DiscoveryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Shop | null>(null)
  const [mapCenter, setMapCenter] = useState(BANGKOK)
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [area, setArea] = useState<Area>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMap, setShowMobileMap] = useState(false)
  const [sort, setSort] = useState<SortMode>('distance')
  const [filterOpen, setFilterOpen] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [strainFilter, setStrainFilter] = useState<StrainFilter>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [amenitySmokingArea, setAmenitySmokingArea] = useState(false)
  const [amenityDelivery, setAmenityDelivery] = useState(false)
  const [amenityEnglish, setAmenityEnglish] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement>>({})
  const filterRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const load = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    const data = await fetchNearbyShops(lat, lng, 15)
    setShops(data)
    setVisibleCount(PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => {
    load(BANGKOK.lat, BANGKOK.lng)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchBookmarkedShopIds(data.user.id).then(ids => setBookmarkedIds(new Set(ids)))
    })
  }, [load]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  const handleBookmarkToggle = async (e: React.MouseEvent, shop: Shop) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { setShowAuth(true); return }
    const isNowBookmarked = await toggleBookmark(shop.id, user.id)
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      if (isNowBookmarked) next.add(shop.id)
      else next.delete(shop.id)
      return next
    })
  }

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    clearTimeout(debounceRef.current)
    if (!q.trim()) {
      load(mapCenter.lat, mapCenter.lng)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const data = await searchShops(q)
      setShops(data)
      setVisibleCount(PAGE_SIZE)
      setLoading(false)
    }, 400)
  }, [mapCenter, load])

  const handleArea = (a: Area, lat?: number, lng?: number) => {
    setArea(a)
    if (lat && lng) {
      setMapCenter({ lat, lng })
      load(lat, lng)
    } else {
      load(BANGKOK.lat, BANGKOK.lng)
      setMapCenter(BANGKOK)
    }
  }

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLoc(loc)
      setMapCenter(loc)
      load(loc.lat, loc.lng)
    })
  }

  const handleSelectShop = (shop: Shop) => {
    setSelected(shop)
    setMapCenter({ lat: shop.lat, lng: shop.lng })
    setTimeout(() => {
      const el = cardRefs.current[shop.id]
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const refCenter = userLoc ?? mapCenter

  // Apply filters + sort client-side
  const displayShops = useMemo(() => {
    return shops
      .filter(s => !onlyOpen || isOpenNow(s.opening_hours))
      .filter(s => !onlyVerified || s.is_verified)
      .filter(s => priceFilter === 'all' || s.price_range === priceFilter)
      .filter(() => strainFilter === 'all' || true) // strain filter reserved for product-level filtering
      .filter(s => !amenitySmokingArea || s.smoking_area)
      .filter(s => !amenityDelivery || s.delivery)
      .filter(s => !amenityEnglish || s.english_staff)
      .sort((a, b) => {
        if (sort === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        const da = calcKm(refCenter.lat, refCenter.lng, a.lat, a.lng)
        const db = calcKm(refCenter.lat, refCenter.lng, b.lat, b.lng)
        return da - db
      })
  }, [shops, onlyOpen, onlyVerified, priceFilter, strainFilter, amenitySmokingArea, amenityDelivery, amenityEnglish, sort, refCenter])

  // Reset page when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [onlyOpen, onlyVerified, strainFilter, priceFilter, amenitySmokingArea, amenityDelivery, amenityEnglish])

  const paginatedShops = displayShops.slice(0, visibleCount)
  const hasMore = visibleCount < displayShops.length

  const activeFilterCount =
    (onlyOpen ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (strainFilter !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (amenitySmokingArea ? 1 : 0) +
    (amenityDelivery ? 1 : 0) +
    (amenityEnglish ? 1 : 0)

  const clearFilters = () => {
    setOnlyOpen(false)
    setOnlyVerified(false)
    setStrainFilter('all')
    setPriceFilter('all')
    setAmenitySmokingArea(false)
    setAmenityDelivery(false)
    setAmenityEnglish(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ===== HEADER ===== */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => {
        supabase.auth.getUser().then(({ data }) => {
          setUser(data.user)
          if (data.user) fetchBookmarkedShopIds(data.user.id).then(ids => setBookmarkedIds(new Set(ids)))
        })
        setShowAuth(false)
      }} />

      <header className="bg-white border-b border-gray-200 shadow-sm z-20 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-3 py-2 space-y-1.5">
          {/* Logo + Search row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xl">🌿</span>
              <span className="font-black text-lg text-green-700 tracking-tight">KUSHMAP</span>
            </div>

            {/* Search */}
            <div className="flex-1 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ショップ名・エリアで検索..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-300 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleLocate}
              className="shrink-0 flex items-center gap-1.5 text-xs text-green-700 border border-green-300 rounded-lg px-2.5 h-9 hover:bg-green-50 transition-colors font-medium"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">現在地</span>
            </button>

            {/* Filter dropdown trigger */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(f => !f)}
                className={`shrink-0 flex items-center gap-1.5 text-xs rounded-lg px-2.5 h-9 transition-colors border relative ${
                  activeFilterCount > 0
                    ? 'bg-green-600 text-white border-green-600'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">絞り込み</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter dropdown */}
              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 space-y-4 z-30">
                  {/* Status */}
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Status</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        onClick={() => setOnlyOpen(v => !v)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          onlyOpen ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        営業中のみ
                      </button>
                      <button
                        onClick={() => setOnlyVerified(v => !v)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          onlyVerified ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        認証済みのみ
                      </button>
                    </div>
                  </div>

                  {/* Strain */}
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ストレイン</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {([['all', '全て'], ['indica', 'Indica'], ['sativa', 'Sativa'], ['hybrid', 'Hybrid'], ['cbd', 'CBD']] as [StrainFilter, string][]).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setStrainFilter(val)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                            strainFilter === val ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">価格</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {([['all', '全て'], [1, '฿'], [2, '฿฿'], [3, '฿฿฿']] as [PriceFilter, string][]).map(([val, label]) => (
                        <button
                          key={String(val)}
                          onClick={() => setPriceFilter(val)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                            priceFilter === val ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenity */}
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">設備</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        onClick={() => setAmenitySmokingArea(v => !v)}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          amenitySmokingArea ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        🚬 喫煙スペース
                      </button>
                      <button
                        onClick={() => setAmenityDelivery(v => !v)}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          amenityDelivery ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        🛵 デリバリー
                      </button>
                      <button
                        onClick={() => setAmenityEnglish(v => !v)}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                          amenityEnglish ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        🇬🇧 英語対応
                      </button>
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center pt-1"
                    >
                      すべてクリア
                    </button>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <Link
                href="/profile"
                className="shrink-0 w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold hover:bg-green-700 transition-colors"
                title={user.email ?? 'プロフィール'}
              >
                {user.email?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
              </Link>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="shrink-0 flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg px-2.5 h-9 hover:bg-gray-50 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログイン</span>
              </button>
            )}
          </div>

          {/* Area filter */}
          <AreaFilter active={area} onChange={handleArea} />
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Shop List — scrollable independently */}
        <div
          ref={listRef}
          className="flex flex-col w-full md:w-[35%] bg-white md:border-r border-gray-200 overflow-y-auto"
        >
          {/* Result count + sort */}
          <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-500 font-medium">
              {loading ? '...' : `${displayShops.length}件`}
              {activeFilterCount > 0 && !loading && (
                <span className="text-green-600 ml-1">絞込中</span>
              )}
            </span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortMode)}
              className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-600 cursor-pointer"
            >
              <option value="distance">距離順</option>
              <option value="newest">新着順</option>
            </select>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-400">ショップを検索中...</p>
              </div>
            </div>
          ) : displayShops.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              {activeFilterCount > 0 ? '条件に合うショップがありません' : 'このエリアにショップはありません'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedShops.map((shop) => (
                <div
                  key={shop.id}
                  ref={(el) => {
                    if (el) cardRefs.current[shop.id] = el
                  }}
                >
                  <ShopListCard
                    shop={shop}
                    distance={calcKm(refCenter.lat, refCenter.lng, shop.lat, shop.lng)}
                    isSelected={selected?.id === shop.id}
                    onClick={() => handleSelectShop(shop)}
                    isBookmarked={bookmarkedIds.has(shop.id)}
                    onBookmarkToggle={(e) => handleBookmarkToggle(e, shop)}
                  />
                </div>
              ))}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    もっと見る（残り{displayShops.length - visibleCount}件）
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Map — sticky, full height, hidden on mobile by default */}
        <div className="hidden md:block md:w-[65%] sticky top-0 h-screen">
          <div className="w-full h-full relative">
            <MapErrorBoundary>
              <MapPanel
                shops={displayShops}
                center={mapCenter}
                selectedId={selected?.id}
                onMarkerClick={handleSelectShop}
                onSearchArea={(lat, lng) => {
                  setMapCenter({ lat, lng })
                  load(lat, lng)
                }}
              />
            </MapErrorBoundary>

            {/* Current location indicator */}
            {userLoc && (
              <div className="absolute top-3 right-3 bg-white rounded-lg shadow px-2 py-1 flex items-center gap-1 text-xs text-blue-600">
                <MapPin className="w-3 h-3" />
                現在地を使用中
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE: Floating "地図を見る" button ===== */}
      <button
        onClick={() => setShowMobileMap(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
      >
        <Map className="w-4 h-4" />
        地図を見る
      </button>

      {/* ===== MOBILE: Full-screen map overlay ===== */}
      {showMobileMap && (
        <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
            <span className="font-bold text-sm text-gray-900">マップ</span>
            <button
              onClick={() => setShowMobileMap(false)}
              className="text-sm text-green-700 font-medium"
            >
              リストに戻る
            </button>
          </div>
          <div className="flex-1 relative">
            <MapErrorBoundary>
              <MapPanel
                shops={displayShops}
                center={mapCenter}
                selectedId={selected?.id}
                onMarkerClick={handleSelectShop}
                onSearchArea={(lat, lng) => {
                  setMapCenter({ lat, lng })
                  load(lat, lng)
                }}
              />
            </MapErrorBoundary>

            {/* Selected shop mini card on mobile map */}
            {selected && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-3 flex gap-3">
                <div className={`w-16 h-16 rounded-lg shrink-0 flex items-center justify-center text-xl font-bold text-white ${selected.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selected.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selected.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-700 font-medium">
                      {selected.price_range === 1 ? '฿' : selected.price_range === 2 ? '฿฿' : '฿฿฿'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {calcKm(refCenter.lat, refCenter.lng, selected.lat, selected.lng).toFixed(1)}km
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
