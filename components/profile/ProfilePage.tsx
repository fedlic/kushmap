'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, LogOut, Leaf } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Shop, Review } from '@/types'
import { fetchMyBookmarkedShops, fetchMyReviews } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function proxyUrl(url: string) {
  return `/api/photo?url=${encodeURIComponent(url)}`
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  )
}

function ShopThumb({ shop }: { shop: Shop }) {
  const img = shop.shop_images?.find(i => i.is_primary) ?? shop.shop_images?.[0]
  if (img?.url) {
    return (
      <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0">
        <Image src={proxyUrl(img.url)} alt={shop.name} fill className="object-cover" unoptimized />
      </div>
    )
  }
  return (
    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <Leaf className="w-5 h-5 text-gray-300" />
    </div>
  )
}

export default function ProfilePage({ user }: { user: User }) {
  const [bookmarks, setBookmarks] = useState<Shop[]>([])
  const [reviews, setReviews] = useState<(Review & { shops: { id: string; name: string; city: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'bookmarks' | 'reviews'>('bookmarks')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      fetchMyBookmarkedShops(user.id),
      fetchMyReviews(user.id),
    ]).then(([bm, rv]) => {
      setBookmarks(bm)
      setReviews(rv)
      setLoading(false)
    })
  }, [user.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const avatarLetter = user.user_metadata?.full_name?.charAt(0)?.toUpperCase()
    ?? user.email?.charAt(0).toUpperCase()
    ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            トップへ
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            ログアウト
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            {user.user_metadata?.full_name && (
              <p className="font-bold text-gray-900">{user.user_metadata.full_name}</p>
            )}
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span><span className="font-bold text-gray-700">{bookmarks.length}</span> ブックマーク</span>
              <span><span className="font-bold text-gray-700">{reviews.length}</span> レビュー</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab('bookmarks')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'bookmarks' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            ブックマーク ({bookmarks.length})
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'reviews' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star className="w-4 h-4" />
            レビュー ({reviews.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm text-center space-y-3">
              <Heart className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-400">ブックマークしたショップがありません</p>
              <Link href="/" className="inline-block text-xs text-green-600 hover:underline">ショップを探す</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {bookmarks.map(shop => (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <ShopThumb shop={shop} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{shop.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{shop.city}</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      {shop.price_range === 1 ? '฿' : shop.price_range === 2 ? '฿฿' : '฿฿฿'}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 shrink-0" />
                </Link>
              ))}
            </div>
          )
        ) : (
          reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm text-center space-y-3">
              <Star className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-400">まだレビューを投稿していません</p>
              <Link href="/" className="inline-block text-xs text-green-600 hover:underline">ショップを探す</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {reviews.map(r => (
                <Link
                  key={r.id}
                  href={r.shops ? `/shops/${r.shops.id}` : '#'}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-sm text-gray-900">{r.shops?.name ?? '不明なショップ'}</p>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <StarDisplay rating={r.rating} />
                  {r.body && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{r.shops?.city}</p>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
