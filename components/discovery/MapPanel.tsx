'use client'

import { useRef } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import type { Shop } from '@/types'

const MARKER_PATH = 'M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18C24 5.373 18.627 0 12 0z'

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
        <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
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
          <MarkerF
            key={shop.id}
            position={{ lat: shop.lat, lng: shop.lng }}
            title={shop.name}
            onClick={() => onMarkerClick(shop)}
            icon={{
              path: MARKER_PATH,
              fillColor: isSelected ? '#f97316' : shop.is_premium ? '#f59e0b' : '#16a34a',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: isSelected ? 1.8 : shop.is_premium ? 1.6 : 1.4,
              anchor: new google.maps.Point(12, 30),
            }}
            zIndex={isSelected ? 20 : shop.is_premium ? 10 : 1}
          />
        )
      })}
    </GoogleMap>
  )
}
