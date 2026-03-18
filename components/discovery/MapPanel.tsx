'use client'

import { useRef } from 'react'
import { GoogleMap, useJsApiLoader, OverlayViewF, OVERLAY_MOUSE_TARGET } from '@react-google-maps/api'
import type { Shop } from '@/types'
import { Leaf } from 'lucide-react'

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
}

interface MapPanelProps {
  shops: Shop[]
  center: { lat: number; lng: number }
  selectedId?: string
  onMarkerClick: (shop: Shop) => void
  onCenterChange: (lat: number, lng: number) => void
}

function PhotoMarker({
  shop,
  isSelected,
  onClick,
}: {
  shop: Shop
  isSelected: boolean
  onClick: () => void
}) {
  const photo = shop.shop_images?.find((i) => i.is_primary) ?? shop.shop_images?.[0]
  const borderColor = isSelected
    ? 'border-orange-500'
    : shop.is_premium
    ? 'border-amber-400'
    : 'border-green-600'
  const ringColor = isSelected
    ? 'shadow-orange-300'
    : shop.is_premium
    ? 'shadow-amber-200'
    : 'shadow-green-200'
  const size = isSelected ? 'w-14 h-14' : 'w-11 h-11'
  const zIndex = isSelected ? 30 : shop.is_premium ? 10 : 1

  return (
    <div
      onClick={onClick}
      style={{ zIndex }}
      className="relative cursor-pointer select-none flex flex-col items-center"
    >
      <div
        className={`
          ${size} rounded-full border-[3px] ${borderColor}
          overflow-hidden bg-white
          shadow-lg ${ringColor}
          transition-all duration-150
          ${isSelected ? 'scale-110' : 'hover:scale-105'}
        `}
        style={{
          transform: `translateX(-50%) translateY(-100%)`,
          marginBottom: 0,
        }}
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
          <div
            className={`w-full h-full flex items-center justify-center ${
              shop.is_premium
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-gradient-to-br from-green-500 to-green-700'
            }`}
          >
            <Leaf className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      {/* Pointer triangle */}
      <div
        style={{ transform: 'translateX(-50%) translateY(-100%)' }}
        className={`w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent ${
          isSelected
            ? 'border-t-orange-500'
            : shop.is_premium
            ? 'border-t-amber-400'
            : 'border-t-green-600'
        }`}
      />
    </div>
  )
}

export default function MapPanel({
  shops,
  center,
  selectedId,
  onMarkerClick,
  onCenterChange,
}: MapPanelProps) {
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full"
      center={center}
      zoom={13}
      options={MAP_OPTIONS}
      onLoad={(map) => { mapRef.current = map }}
      onIdle={() => {
        const c = mapRef.current?.getCenter()
        if (c) onCenterChange(c.lat(), c.lng())
      }}
    >
      {shops.map((shop) => {
        const isSelected = shop.id === selectedId
        return (
          <OverlayViewF
            key={shop.id}
            position={{ lat: shop.lat, lng: shop.lng }}
            mapPaneName={OVERLAY_MOUSE_TARGET}
          >
            <PhotoMarker
              shop={shop}
              isSelected={isSelected}
              onClick={() => onMarkerClick(shop)}
            />
          </OverlayViewF>
        )
      })}
    </GoogleMap>
  )
}
