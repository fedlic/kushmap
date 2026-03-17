'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Shop } from '@/types'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, Leaf } from 'lucide-react'

interface ShopListCardProps {
  shop: Shop
  distance?: number
  isSelected?: boolean
  onClick?: () => void
}

function PriceLabel({ n }: { n?: 1 | 2 | 3 }) {
  const label = n === 1 ? '฿' : n === 2 ? '฿฿' : n === 3 ? '฿฿฿' : '—'
  const dim = n === 1 ? '฿฿' : n === 2 ? '฿' : ''
  return (
    <span className="text-sm font-medium">
      <span className="text-green-700">{label}</span>
      {dim && <span className="text-gray-300">{dim}</span>}
    </span>
  )
}

function StarRow({ rating, count }: { rating?: number; count?: number }) {
  const r = rating ?? 0
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
      {count != null && count > 0 ? (
        <span className="text-xs text-gray-500 ml-0.5">{count}件</span>
      ) : (
        <span className="text-xs text-gray-400 ml-0.5">レビューなし</span>
      )}
    </div>
  )
}

function distanceLabel(km?: number) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

function ShopPhoto({ shop }: { shop: Shop }) {
  const primary = shop.shop_images?.find((i) => i.is_primary) ?? shop.shop_images?.[0]
  if (primary?.url) {
    return (
      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden relative">
        <Image
          src={primary.url}
          alt={shop.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    )
  }
  return (
    <div className="shrink-0 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
      <Leaf className="w-6 h-6 text-gray-300" />
    </div>
  )
}

export default function ShopListCard({ shop, distance, isSelected, onClick }: ShopListCardProps) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      onClick={onClick}
      className={`flex gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-orange-50 ${
        isSelected ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''
      }`}
    >
      <ShopPhoto shop={shop} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-1.5 flex-wrap">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{shop.name}</h3>
          {shop.is_verified && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-4 shrink-0">
              認証済み
            </Badge>
          )}
          {shop.is_premium && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-4 shrink-0">
              ★ Premium
            </Badge>
          )}
        </div>

        <StarRow />

        <div className="flex items-center gap-2 flex-wrap">
          <PriceLabel n={shop.price_range} />
          <span className="text-gray-300 text-xs">|</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-700 border-green-300">
            Dispensary
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {shop.city}
          </span>
          {distance != null && (
            <>
              <span>·</span>
              <span>{distanceLabel(distance)}</span>
            </>
          )}
        </div>

        {shop.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {shop.description}
          </p>
        )}
      </div>
    </Link>
  )
}
