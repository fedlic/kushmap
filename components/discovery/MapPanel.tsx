'use client'

import { useRef, useCallback, useState, memo, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, OverlayViewF, OVERLAY_MOUSE_TARGET, MarkerClustererF, MarkerF } from '@react-google-maps/api'
import type { Shop } from '@/types'
import { Leaf, Search } from 'lucide-react'

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
}

const MAX_MARKERS = 150
const CLUSTER_ZOOM_THRESHOLD = 14

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

const CLUSTER_OPTIONS = {
  maxZoom: CLUSTER_ZOOM_THRESHOLD,
  minimumClusterSize: 5,
  styles: [
    {
      url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52"><circle cx="26" cy="26" r="24" fill="#16a34a" stroke="white" stroke-width="3" opacity="0.9"/></svg>'),
      height: 52,
      width: 52,
      textColor: '#ffffff',
      textSize: 14,
      fontWeight: 'bold',
    },
    {
      url: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="62" height="62"><circle cx="31" cy="31" r="29" fill="#15803d" stroke="white" stroke-width="3" opacity="0.9"/></svg>'),
      height: 62,
      width: 62,
      textColor: '#ffffff',
      textSize: 15,
      fontWeight: 'bold',
    },
  ],
}

export default function MapPanel({ shops, center, selectedId, onMarkerClick, onSearchArea }: MapPanelProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [showSearchBtn, setShowSearchBtn] = useState(false)
  const [searchCenter, setSearchCenter] = useState(center)
  const [zoom, setZoom] = useState(13)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // Limit markers to viewport + max cap
  const visibleShops = useMemo(() => {
    if (!mapRef.current) return shops.slice(0, MAX_MARKERS)
    const bounds = mapRef.current.getBounds()
    if (!bounds) return shops.slice(0, MAX_MARKERS)
    const inView = shops.filter(s => bounds.contains({ lat: s.lat, lng: s.lng }))
    // Always include selected shop
    const selected = selectedId ? shops.find(s => s.id === selectedId) : null
    const result = inView.slice(0, MAX_MARKERS)
    if (selected && !result.find(s => s.id === selectedId)) result.push(selected)
    return result
  }, [shops, selectedId, zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleIdle = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const c = map.getCenter()
    if (c) setSearchCenter({ lat: c.lat(), lng: c.lng() })
    setZoom(map.getZoom() ?? 13)
    setShowSearchBtn(true)
  }, [])

  const useCluster = zoom < CLUSTER_ZOOM_THRESHOLD

  // Cluster markers (google.maps.Marker based) for zoomed out
  const clusterMarkers = useMemo(() => {
    if (!useCluster || !isLoaded) return []
    return visibleShops.map(shop => ({
      shop,
      position: { lat: shop.lat, lng: shop.lng },
    }))
  }, [visibleShops, useCluster, isLoaded])

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
        onLoad={handleMapLoad}
        onIdle={handleIdle}
      >
        {useCluster ? (
          <MarkerClustererF options={CLUSTER_OPTIONS}>
            {(clusterer) => (
              <>
                {clusterMarkers.map(({ shop }) => (
                  <MarkerF
                    key={shop.id}
                    position={{ lat: shop.lat, lng: shop.lng }}
                    clusterer={clusterer}
                    onClick={() => onMarkerClick(shop)}
                    icon={{
                      url: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="${shop.id === selectedId ? '#f97316' : shop.is_premium ? '#f59e0b' : '#16a34a'}" stroke="white" stroke-width="2"/></svg>`),
                      scaledSize: new google.maps.Size(24, 24),
                      anchor: new google.maps.Point(12, 12),
                    }}
                  />
                ))}
              </>
            )}
          </MarkerClustererF>
        ) : (
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
          ))
        )}
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
