'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, MapPin, List, Map, LocateFixed, X, SlidersHorizontal } from 'lucide-react'
import { fetchNearbyShops, searchShops } from '@/lib/supabase/queries'
import type { Shop } from '@/types'
import ShopListCard from './ShopListCard'
import AreaFilter, { type Area } from './AreaFilter'
import MapErrorBoundary from './MapErrorBoundary'
import dynamic from 'next/dynamic'

const MapPanel = dynamic(() => import('./MapPanel'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>,
})

const BANGKOK = { lat: 13.7563, lng: 100.5018 }

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

export default function DiscoveryPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Shop | null>(null)
  const [mapCenter, setMapCenter] = useState(BANGKOK)
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [area, setArea] = useState<Area>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement>>({})

  const load = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    const data = await fetchNearbyShops(lat, lng, 15)
    setShops(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load(BANGKOK.lat, BANGKOK.lng)
  }, [load])

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
    // Scroll card into view
    setTimeout(() => {
      const el = cardRefs.current[shop.id]
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const refCenter = userLoc ?? mapCenter

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 space-y-2.5">
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

            <button className="shrink-0 flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg px-2.5 h-9 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">絞り込み</span>
            </button>
          </div>

          {/* Area filter */}
          <AreaFilter active={area} onChange={handleArea} />
        </div>
      </header>

      {/* ===== MOBILE VIEW TOGGLE ===== */}
      <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mobileView === 'list' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'
          }`}
        >
          <List className="w-4 h-4" />
          リスト
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mobileView === 'map' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'
          }`}
        >
          <Map className="w-4 h-4" />
          マップ
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Shop List */}
        <div
          ref={listRef}
          className={`${
            mobileView === 'map' ? 'hidden' : 'flex'
          } md:flex flex-col w-full md:w-[58%] bg-white border-r border-gray-200 overflow-y-auto`}
        >
          {/* Result count */}
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-500 font-medium">
              {loading ? '読み込み中...' : `${shops.length}件のショップ`}
            </span>
            <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600">
              <option>距離順</option>
              <option>評価順</option>
              <option>新着順</option>
            </select>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-400">ショップを検索中...</p>
              </div>
            </div>
          ) : shops.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              このエリアにショップはありません
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {shops.map((shop) => (
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
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Map */}
        <div
          className={`${
            mobileView === 'list' ? 'hidden' : 'flex'
          } md:flex flex-col w-full md:w-[42%] relative`}
        >
          <MapErrorBoundary>
            <MapPanel
              shops={shops}
              center={mapCenter}
              selectedId={selected?.id}
              onMarkerClick={handleSelectShop}
              onCenterChange={(lat, lng) => {
                setMapCenter({ lat, lng })
                clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => load(lat, lng), 800)
              }}
            />
          </MapErrorBoundary>

          {/* Selected shop mini card on map */}
          {selected && mobileView === 'map' && (
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

          {/* Current location dot indicator */}
          {userLoc && (
            <div className="absolute top-3 right-3 bg-white rounded-lg shadow px-2 py-1 flex items-center gap-1 text-xs text-blue-600">
              <MapPin className="w-3 h-3" />
              現在地を使用中
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
