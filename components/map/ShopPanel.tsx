'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, ExternalLink, Phone, Instagram } from 'lucide-react'
import type { Shop } from '@/types'
import { useRouter } from 'next/navigation'

interface ShopPanelProps {
  shop: Shop | null
  distance?: number
  onClose: () => void
  isMobile: boolean
}

function priceLabel(n?: 1 | 2 | 3) {
  return n === 1 ? '$' : n === 2 ? '$$' : n === 3 ? '$$$' : '—'
}

function PanelContent({ shop, distance }: Omit<ShopPanelProps, 'isMobile' | 'onClose'>) {
  const router = useRouter()
  if (!shop) return null

  return (
    <div className="flex flex-col h-full">
      {/* Image */}
      <div className="h-44 bg-gradient-to-br from-green-800 to-green-600 relative shrink-0">
        {shop.is_premium && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0">
            ★ Premium
          </Badge>
        )}
        {shop.is_verified && (
          <Badge className="absolute top-3 right-3 bg-green-700 text-white border-0">
            認証済み
          </Badge>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold leading-tight">{shop.name}</h2>
            <span className="text-sm font-semibold text-green-700 shrink-0">
              {priceLabel(shop.price_range)}
            </span>
          </div>
          {shop.name_th && (
            <p className="text-sm text-muted-foreground">{shop.name_th}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">—</span>
          </span>
          {distance != null && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </span>
          )}
        </div>

        {shop.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {shop.description}
          </p>
        )}

        <div className="text-sm text-muted-foreground flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{shop.address}</span>
        </div>

        <div className="flex gap-2">
          {shop.phone && (
            <a href={`tel:${shop.phone}`}>
              <Button variant="outline" size="sm">
                <Phone className="w-3 h-3 mr-1" /> 電話
              </Button>
            </a>
          )}
          {shop.instagram && (
            <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Instagram className="w-3 h-3 mr-1" /> Instagram
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t shrink-0">
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={() => router.push(`/shop?id=${shop.id}`)}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          詳細を見る
        </Button>
      </div>
    </div>
  )
}

export default function ShopPanel({ shop, distance, onClose, isMobile }: ShopPanelProps) {
  if (isMobile) {
    return (
      <Sheet open={!!shop} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl h-[85vh] max-h-[85vh]">
          <PanelContent shop={shop} distance={distance} />
        </SheetContent>
      </Sheet>
    )
  }

  if (!shop) return null

  return (
    <div className="absolute left-4 top-4 bottom-4 w-80 bg-white rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col">
      <PanelContent shop={shop} distance={distance} />
    </div>
  )
}
