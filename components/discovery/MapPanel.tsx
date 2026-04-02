'use client'

import { useRef, useCallback, useState, memo, useMemo, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, OverlayViewF, OVERLAY_MOUSE_TARGET } from '@react-google-maps/api'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import type { Shop } from '@/types'
import { Leaf, Search } from 'lucide-react'

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
  mapId: 'kushmap-discovery',
}

const MAX_MARKERS = 150
const CLUSTER_ZOOM_THRESHOLD = 14
const LIBRARIES: ('marker')[] = ['marker']

interface MapPanelProps {
  shops: Shop[]
  center: { lat: number; lng: number }
  selectedId?: string
  onMarkerClick: (shop: Shop) => void
  onSearchArea: (lat: number, lng: number) => void
}

const PhotoMarker = memo(function PhotoMarker({
  shop,
  isSelected,
  onClick,
}: {
  shop: Shop
  isSelected: boolean
  onClick: () => void
}) {
  const photo = shop.shop_images?.find((i) => i.is_primary) ?? shop.shop_images?.[0]
  const borderColor = isSelected ? 'border-orange-500' : shop.is_premium ? 'border-amber-400' : 'border-green-600'
  const size = isSelected ? 'w-14 h-14' : 'w-11 h-11'

  return (
    <div
      onClick={onClick}
      style={{ zIndex: isSelected ? 30 : shop.is_premium ? 10 : 1 }}
      className="relative cursor-pointer select-none flex flex-col items-center"
    >
      <div
        className={`${size} rounded-full border-[3px] ${borderColor} overflow-hidden bg-white shadow-lg transition-transform duration-150 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
        style={{ transform: 'translateX(-50%) translateY(-100%)' }}
      >
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={shop.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${shop.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div
        style={{ transform: 'translateX(-50%) translateY(-100%)' }}
        className={`w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent ${isSelected ? 'border-t-orange-500' : shop.is_premium ? 'border-t-amber-400' : 'border-t-green-600'}`}
      />
    </div>
  )
})

function createClusterRenderer() {
  return {
    render({ count, position }: { count: number; position: google.maps.LatLng }) {
      const size = count > 50 ? 62 : 52
      const r = size / 2
      const color = count > 50 ? '#15803d' : '#16a34a'
      const fontSize = count > 50 ? 15 : 14
      const div = document.createElement('div')
      div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}" stroke="white" stroke-width="3" opacity="0.9"/><text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${fontSize}" font-weight="bold">${count}</text></svg>`
      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: div,
        zIndex: count,
      })
    },
  }
}

export default function MapPanel({ shops, center, selectedId, onMarkerClick, onSearchArea }: MapPanelProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [showSearchBtn, setShowSearchBtn] = useState(false)
  const [searchCenter, setSearchCenter] = useState(center)
  const [zoom, setZoom] = useState(13)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const clusterMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const onMarkerClickRef = useRef(onMarkerClick)
  onMarkerClickRef.current = onMarkerClick

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  })

  // Limit markers to viewport + max cap
  const visibleShops = useMemo(() => {
    if (!map) return shops.slice(0, MAX_MARKERS)
    const bounds = map.getBounds()
    if (!bounds) return shops.slice(0, MAX_MARKERS)
    const inView = shops.filter(s => bounds.contains({ lat: s.lat, lng: s.lng }))
    const selected = selectedId ? shops.find(s => s.id === selectedId) : null
    const result = inView.slice(0, MAX_MARKERS)
    if (selected && !result.find(s => s.id === selectedId)) result.push(selected)
    return result
  }, [shops, selectedId, zoom, map]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleIdle = useCallback(() => {
    if (!map) return
    const c = map.getCenter()
    if (c) setSearchCenter({ lat: c.lat(), lng: c.lng() })
    setZoom(map.getZoom() ?? 13)
    setShowSearchBtn(true)
  }, [map])

  const useCluster = zoom < CLUSTER_ZOOM_THRESHOLD

  // Manage clustered AdvancedMarkerElement markers
  useEffect(() => {
    if (!map || !useCluster || !isLoaded) return

    // Clear previous
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
    }
    clusterMarkersRef.current.forEach(m => { m.map = null })
    clusterMarkersRef.current = []

    const markers = visibleShops.map(shop => {
      const color = shop.id === selectedId ? '#f97316' : shop.is_premium ? '#f59e0b' : '#16a34a'
      const div = document.createElement('div')
      div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/></svg>`

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: shop.lat, lng: shop.lng },
        content: div,
      })
      marker.addListener('click', () => onMarkerClickRef.current(shop))
      return marker
    })

    clusterMarkersRef.current = markers

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      algorithm: new SuperClusterAlgorithm({ maxZoom: CLUSTER_ZOOM_THRESHOLD }),
      renderer: createClusterRenderer(),
    })

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers()
        clustererRef.current = null
      }
      markers.forEach(m => { m.map = null })
      clusterMarkersRef.current = []
    }
  }, [map, visibleShops, useCluster, isLoaded, selectedId])

  // Clean up cluster when switching to non-cluster mode
  useEffect(() => {
    if (!useCluster && clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
      clusterMarkersRef.current.forEach(m => { m.map = null })
      clusterMarkersRef.current = []
    }
  }, [useCluster])

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(m) => setMap(m)}
        onIdle={handleIdle}
      >
        {!useCluster &&
          visibleShops.map((shop) => (
            <OverlayViewF
              key={shop.id}
              position={{ lat: shop.lat, lng: shop.lng }}
              mapPaneName={OVERLAY_MOUSE_TARGET}
            >
              <PhotoMarker
                shop={shop}
                isSelected={shop.id === selectedId}
                onClick={() => onMarkerClick(shop)}
              />
            </OverlayViewF>
          ))}
      </GoogleMap>

      {/* Search this area button */}
      {showSearchBtn && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => {
              setShowSearchBtn(false)
              onSearchArea(searchCenter.lat, searchCenter.lng)
            }}
            className="flex items-center gap-1.5 bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            このエリアで検索
          </button>
        </div>
      )}
    </div>
  )
}
