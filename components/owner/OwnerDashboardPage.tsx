'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Phone, Globe, Instagram, Clock, Edit2, Save, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchMyShops, updateShop, fetchShopReviewsForOwner } from '@/lib/supabase/owner-queries'
import type { Shop, Review } from '@/types'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/auth/AuthModal'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<string, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  )
}

function ShopEditor({ shop, onSaved }: { shop: Shop; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: shop.name,
    description: shop.description ?? '',
    phone: shop.phone ?? '',
    website: shop.website ?? '',
    instagram: shop.instagram ?? '',
    price_range: shop.price_range ?? 2,
  })
  const [hours, setHours] = useState<Record<string, string>>(shop.opening_hours ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviews, setShowReviews] = useState(false)

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  useEffect(() => {
    fetchShopReviewsForOwner(shop.id).then(setReviews)
  }, [shop.id])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error } = await updateShop(shop.id, {
      ...form,
      price_range: Number(form.price_range) as 1 | 2 | 3,
      description: form.description || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      instagram: form.instagram || undefined,
      opening_hours: Object.keys(hours).length ? hours : undefined,
    })
    if (error) setError(error)
    else { setEditing(false); onSaved() }
    setSaving(false)
  }

  const photo = shop.shop_images?.find(i => i.is_primary) ?? shop.shop_images?.[0]

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Shop header */}
      <div className="flex items-start gap-4 p-5 border-b border-gray-100">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
          {photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/photo?url=${encodeURIComponent(photo.url)}`} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xl">
              {shop.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 truncate">{shop.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{shop.city}</p>
          <div className="flex items-center gap-2 mt-1">
            {reviews.length > 0 ? (
              <>
                <StarDisplay rating={avgRating} />
                <span className="text-xs text-gray-500">{avgRating.toFixed(1)} ({reviews.length}件)</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">レビューなし</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/shops/${shop.id}`}
            target="_blank"
            className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            店舗ページ
          </Link>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {editing ? 'キャンセル' : '編集'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="p-5 space-y-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">店舗名</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">価格帯</label>
              <select
                value={form.price_range}
                onChange={e => setForm(f => ({ ...f, price_range: Number(e.target.value) as 1|2|3 }))}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value={1}>฿ リーズナブル</option>
                <option value={2}>฿฿ 普通</option>
                <option value={3}>฿฿฿ 高級</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">説明</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1 flex items-center gap-1"><Phone className="w-3 h-3" />電話</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0xx-xxx-xxxx"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1 flex items-center gap-1"><Globe className="w-3 h-3" />ウェブサイト</label>
              <input
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1 flex items-center gap-1"><Instagram className="w-3 h-3" />Instagram</label>
              <input
                value={form.instagram}
                onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="@shopname"
              />
            </div>
          </div>

          {/* Opening hours */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2 flex items-center gap-1"><Clock className="w-3 h-3" />営業時間</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DAY_KEYS.map(key => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-5">{DAY_LABELS[key]}</span>
                  <input
                    value={hours[key] ?? ''}
                    onChange={e => setHours(h => ({ ...h, [key]: e.target.value }))}
                    placeholder="10:00-22:00"
                    className="flex-1 h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      )}

      {/* Reviews summary */}
      {reviews.length > 0 && (
        <div className="p-5">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            受信レビュー {reviews.length}件
            <span className="text-gray-400 text-xs">{showReviews ? '▲' : '▼'}</span>
          </button>

          {showReviews && (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="border-l-2 border-gray-100 pl-3">
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  {r.body && <p className="text-xs text-gray-600 mt-1">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OwnerDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const load = async (uid: string) => {
    setLoading(true)
    const data = await fetchMyShops(uid)
    setShops(data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) load(data.user.id)
      else setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthModal open={true} onClose={() => router.push('/')} onSuccess={() => {
          supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
            if (data.user) load(data.user.id)
          })
        }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              トップへ
            </Link>
            <span className="text-gray-300">·</span>
            <span className="font-bold text-gray-900">オーナーダッシュボード</span>
          </div>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-gray-900">登録ショップ ({shops.length}件)</h1>
          <Link
            href="/owner/register"
            className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            ショップを追加
          </Link>
        </div>

        {shops.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center space-y-3">
            <p className="text-gray-500 text-sm">まだショップが登録されていません</p>
            <Link
              href="/owner/register"
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ショップを登録する
            </Link>
          </div>
        ) : (
          shops.map(shop => (
            <ShopEditor
              key={shop.id}
              shop={shop}
              onSaved={() => load(user.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
