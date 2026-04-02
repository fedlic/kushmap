'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shop } from '@/types'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, Leaf, Heart } from 'lucide-react'

interface ShopListCardProps {
  shop: Shop
  distance?: number
  isSelected?: boolean
  onClick?: () => void
  isBookmarked?: boolean
  onBookmarkToggle?: (e: React.MouseEvent) => void
}

function PriceLabel({ n }: { n?: 1 | 2 | 3 }) {
  if (!n) return <span className="text-xs font-medium text-gray-400">—</span>
  return (
    <span className="text-xs font-medium tracking-tight">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= n ? 'text-green-700' : 'text-gray-300'}>$</span>
      ))}
    </span>
  )
}

function distanceLabel(km?: number) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

function proxyUrl(url: string) {
  return url
}

function ShopPhoto({ shop }: { shop: Shop }) {
  const primary = shop.shop_images?.find((i) => i.is_primary) ?? shop.shop_images?.[0]
  const [imgError, setImgError] = useState(false)

  if (primary?.url && !imgError) {
    return (
      <div className="shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden relative bg-green-50">
        <Image
          src={proxyUrl(primary.url)}
          alt={shop.name}
          fill
          className="object-cover"
          loading="lazy"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    )
  }
  return (
    <div className="shrink-0 w-[72px] h-[72px] rounded-lg bg-green-50 flex items-center justify-center">
      <Leaf className="w-5 h-5 text-green-300" />
    </div>
  )
}

export default function ShopListCard({ shop, distance, isSelected, onClick, isBookmarked, onBookmarkToggle }: ShopListCardProps) {
  const isPremiumActive = shop.is_premium && (!shop.premium_expires_at || new Date(shop.premium_expires_at) > new Date())

  return (
    <Link
      href={`/shop?id=${shop.id}`}
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors hover:bg-orange-50 relative ${
        isSelected ? 'bg-orange-50 border-l-3 border-l-orange-400' : ''
      } ${isPremiumActive ? 'bg-amber-50/50 border-l-4 border-l-amber-400' : ''}`}
    >
      <ShopPhoto shop={shop} />

      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-1 flex-wrap">
          <h3
            className="font-bold text-gray-900 text-xs leading-tight"
            title={shop.name}
          >
            {shop.name.length > 25 ? shop.name.slice(0, 25) + '...' : shop.name}
          </h3>
          {shop.is_verified && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1 py-0 h-3.5 shrink-0">
              Verified
            </Badge>
          )}
          {isPremiumActive && (
            <Badge className="bg-yellow-400 text-black border-yellow-500 text-[9px] px-1.5 py-0 h-4 shrink-0 font-bold">
              FEATURED
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="w-3 h-3 fill-gray-200 text-gray-200"
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <PriceLabel n={shop.price_range} />
          <span className="text-gray-300 text-[10px]">|</span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <MapPin className="w-2.5 h-2.5" />
            {shop.city}
          </span>
          {distance != null && (
            <>
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-[10px] text-gray-400">{distanceLabel(distance)}</span>
            </>
          )}
        </div>
      </div>

      {onBookmarkToggle && (
        <button
          onClick={onBookmarkToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
        >
          <Heart
            className={`w-7 h-7 transition-colors ${isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
          />
        </button>
      )}
    </Link>
  )
}
