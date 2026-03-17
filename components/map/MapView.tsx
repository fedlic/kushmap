'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import { fetchNearbyShops, searchShops } from '@/lib/supabase/queries'
import type { Shop, FilterType } from '@/types'
import SearchBar from './SearchBar'
import FilterChips from './FilterChips'
import ShopPanel from './ShopPanel'

const BANGKOK = { lat: 13.7563, lng: 100.5018 }

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  minZoom: 10,
  maxZoom: 19,
}

const MARKER_PATH = 'M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18C24 5.373 18.627 0 12 0z'

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
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

export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  const [shops, setShops] = useState<Shop[]>([])
  const [selected, setSelected] = useState<Shop | null>(null)
  const [mapCenter, setMapCenter] = useState(BANGKOK)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isMobile, setIsMobile] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadShops = useCallback(async (lat: number, lng: number) => {
    const data = await fetchNearbyShops(lat, lng, 10)
    setShops(data)
  }, [])

  useEffect(() => {
    loadShops(BANGKOK.lat, BANGKOK.lng)
  }, [loadShops])

  const onMapIdle = useCallback(() => {
    if (!mapRef.current) return
    const c = mapRef.current.getCenter()
    if (!c) return
    const lat = c.lat()
    const lng = c.lng()
    setMapCenter({ lat, lng })
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadShops(lat, lng), 600)
  }, [loadShops])

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      loadShops(mapCenter.lat, mapCenter.lng)
      return
    }
    const data = await searchShops(q)
    setShops(data)
    if (data[0] && mapRef.current) {
      mapRef.current.panTo({ lat: data[0].lat, lng: data[0].lng })
    }
  }, [mapCenter, loadShops])

  const handleLocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLocation(loc)
      mapRef.current?.panTo(loc)
      mapRef.current?.setZoom(14)
      loadShops(loc.lat, loc.lng)
    })
  }, [loadShops])

  const filteredShops = shops.filter(() => {
    if (filter === 'all') return true
    return true
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-green-950">
        <div className="text-center text-white space-y-3">
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-green-300 text-sm">マップを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Google Map */}
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={BANGKOK}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(map) => { mapRef.current = map }}
        onIdle={onMapIdle}
        onClick={() => setSelected(null)}
      >
        {filteredShops.map((shop) => (
          <MarkerF
            key={shop.id}
            position={{ lat: shop.lat, lng: shop.lng }}
            icon={shop.is_premium ? {
              path: MARKER_PATH,
              fillColor: '#f59e0b',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.6,
              anchor: new google.maps.Point(12, 30),
            } : {
              path: MARKER_PATH,
              fillColor: '#16a34a',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.4,
              anchor: new google.maps.Point(12, 30),
            }}
            title={shop.name}
            onClick={() => setSelected(shop)}
            zIndex={shop.is_premium ? 10 : 1}
          />
        ))}

        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {/* Top overlay: search + filters */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 space-y-2 pointer-events-none">
        {/* KUSHMAP logo */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-lg drop-shadow-lg tracking-wide">🌿 KUSHMAP</span>
          <span className="text-xs text-white/60 bg-black/30 px-2 py-0.5 rounded-full">
            {shops.length}件
          </span>
        </div>

        <div className="pointer-events-auto">
          <SearchBar onSearch={handleSearch} onLocate={handleLocate} />
        </div>
        <div className="pointer-events-auto">
          <FilterChips active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Shop Panel */}
      <ShopPanel
        shop={selected}
        distance={
          selected
            ? calcDistance(mapCenter.lat, mapCenter.lng, selected.lat, selected.lng)
            : undefined
        }
        onClose={() => setSelected(null)}
        isMobile={isMobile}
      />
    </div>
  )
}
