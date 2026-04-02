'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { fetchNearbyShops, searchShops } from '@/lib/supabase/queries'
import type { Shop, FilterType } from '@/types'
import SearchBar from './SearchBar'
import FilterChips from './FilterChips'
import ShopPanel from './ShopPanel'

const BANGKOK = { lat: 13.7563, lng: 100.5018 }
const LIBRARIES: ('marker')[] = ['marker']

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  minZoom: 10,
  maxZoom: 19,
  mapId: 'kushmap',
}

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

function createPinContent(color: string, scale: number): HTMLElement {
  const size = Math.round(24 * scale)
  const div = document.createElement('div')
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.5)}" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`
  return div
}

function createUserLocationContent(): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
  </svg>`
  return div
}

export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  })

  const [shops, setShops] = useState<Shop[]>([])
  const [selected, setSelected] = useState<Shop | null>(null)
  const [mapCenter, setMapCenter] = useState(BANGKOK)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

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
    if (!map) return
    const c = map.getCenter()
    if (!c) return
    const lat = c.lat()
    const lng = c.lng()
    setMapCenter({ lat, lng })
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadShops(lat, lng), 600)
  }, [map, loadShops])

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      loadShops(mapCenter.lat, mapCenter.lng)
      return
    }
    const data = await searchShops(q)
    setShops(data)
    if (data[0] && map) {
      map.panTo({ lat: data[0].lat, lng: data[0].lng })
    }
  }, [mapCenter, loadShops, map])

  const handleLocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLocation(loc)
      map?.panTo(loc)
      map?.setZoom(14)
      loadShops(loc.lat, loc.lng)
    })
  }, [loadShops, map])

  const filteredShops = shops.filter(() => {
    if (filter === 'all') return true
    return true
  })

  // Manage shop markers
  useEffect(() => {
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach(m => { m.map = null })
    markersRef.current = []

    const markers = filteredShops.map(shop => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: shop.lat, lng: shop.lng },
        title: shop.name,
        zIndex: shop.is_premium ? 10 : 1,
        content: createPinContent(
          shop.is_premium ? '#f59e0b' : '#16a34a',
          shop.is_premium ? 1.6 : 1.4
        ),
      })
      marker.addListener('click', () => setSelected(shop))
      return marker
    })

    markersRef.current = markers

    return () => {
      markers.forEach(m => { m.map = null })
    }
  }, [map, filteredShops])

  // Manage user location marker
  useEffect(() => {
    if (!map) return

    if (userMarkerRef.current) {
      userMarkerRef.current.map = null
      userMarkerRef.current = null
    }

    if (userLocation) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: userLocation,
        content: createUserLocationContent(),
        zIndex: 20,
      })
      userMarkerRef.current = marker
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null
        userMarkerRef.current = null
      }
    }
  }, [map, userLocation])

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
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={BANGKOK}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(m) => setMap(m)}
        onIdle={onMapIdle}
        onClick={() => setSelected(null)}
      />

      {/* Top overlay: search + filters */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-lg drop-shadow-lg tracking-wide">KUSHMAP</span>
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
