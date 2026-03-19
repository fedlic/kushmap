'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Phone, Globe, Instagram, Clock, Edit2, Save, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchMyShops, updateShop, fetchShopReviewsForOwner } from '@/lib/supabase/owner-queries'
import type { Shop, Review, Product } from '@/types'
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

function AmenityToggle({ label, icon, checked, onChange }: { label: string; icon: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`w-9 h-5 rounded-full transition-colors flex items-center ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-xs">{icon} {label}</span>
    </label>
  )
}

interface ProductFormData {
  name: string
  strain_type: 'indica' | 'sativa' | 'hybrid' | 'cbd'
  thc_percent: string
  price_thb: string
  in_stock: boolean
  category: 'flower' | 'oil' | 'edible' | 'joint' | 'cbd'
}

const emptyProduct: ProductFormData = {
  name: '',
  strain_type: 'hybrid',
  thc_percent: '',
  price_thb: '',
  in_stock: true,
  category: 'flower',
}

function ProductManager({ shopId }: { shopId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<ProductFormData>(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('shop_id', shopId).order('created_at', { ascending: false })
    setProducts((data ?? []) as Product[])
  }

  useEffect(() => { loadProducts() }, [shopId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      shop_id: shopId,
      name: form.name,
      strain_type: form.strain_type,
      category: form.category,
      thc_percent: form.thc_percent ? parseFloat(form.thc_percent) : null,
      price_thb: form.price_thb ? parseInt(form.price_thb) : null,
      in_stock: form.in_stock,
    }
    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId)
    } else {
      await supabase.from('products').insert(payload)
    }
    setForm(emptyProduct)
    setShowAdd(false)
    setEditingId(null)
    await loadProducts()
    setSaving(false)
  }

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name,
      strain_type: (p.strain_type as ProductFormData['strain_type']) ?? 'hybrid',
      thc_percent: p.thc_percent?.toString() ?? '',
      price_thb: p.price_thb?.toString() ?? '',
      in_stock: p.in_stock,
      category: (p.category as ProductFormData['category']) ?? 'flower',
    })
    setEditingId(p.id)
    setShowAdd(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    await loadProducts()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">商品管理</h3>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm(emptyProduct) }}
          className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          追加
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2.5 border border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 mb-0.5 block">商品名</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="商品名"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">カテゴリ</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductFormData['category'] }))}
                className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="flower">Flower</option>
                <option value="oil">Oil</option>
                <option value="edible">Edible</option>
                <option value="joint">Joint</option>
                <option value="cbd">CBD</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">ストレイン種別</label>
              <select
                value={form.strain_type}
                onChange={e => setForm(f => ({ ...f, strain_type: e.target.value as ProductFormData['strain_type'] }))}
                className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
                <option value="cbd">CBD</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">THC%</label>
              <input
                type="number"
                step="0.1"
                value={form.thc_percent}
                onChange={e => setForm(f => ({ ...f, thc_percent: e.target.value }))}
                className="w-full h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="例: 22.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">価格（THB）</label>
              <input
                type="number"
                value={form.price_thb}
                onChange={e => setForm(f => ({ ...f, price_thb: e.target.value }))}
                className="w-full h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="例: 500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.in_stock}
              onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-xs text-gray-600">在庫あり</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {saving ? '保存中...' : editingId ? '更新する' : '追加する'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyProduct) }}
              className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">商品が登録されていません</p>
      ) : (
        <div className="space-y-1.5">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-gray-800 truncate">{p.name}</span>
                {p.strain_type && (
                  <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${
                    p.strain_type === 'sativa' ? 'bg-yellow-100 text-yellow-700' :
                    p.strain_type === 'indica' ? 'bg-purple-100 text-purple-700' :
                    p.strain_type === 'cbd' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {p.strain_type}
                  </span>
                )}
                {!p.in_stock && <span className="text-[10px] text-red-500">売切れ</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.price_thb != null && <span className="text-xs font-medium text-green-700">฿{p.price_thb}</span>}
                <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-gray-600 p-1">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [amenities, setAmenities] = useState({
    smoking_area: shop.smoking_area ?? false,
    english_staff: shop.english_staff ?? false,
    delivery: shop.delivery ?? false,
    card_payment: shop.card_payment ?? false,
    wifi: shop.wifi ?? false,
  })
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
      ...amenities,
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

          {/* Amenities */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">店舗設備</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AmenityToggle icon="🚬" label="喫煙スペース" checked={amenities.smoking_area} onChange={v => setAmenities(a => ({ ...a, smoking_area: v }))} />
              <AmenityToggle icon="🇬🇧" label="英語対応" checked={amenities.english_staff} onChange={v => setAmenities(a => ({ ...a, english_staff: v }))} />
              <AmenityToggle icon="🛵" label="デリバリー" checked={amenities.delivery} onChange={v => setAmenities(a => ({ ...a, delivery: v }))} />
              <AmenityToggle icon="💳" label="カード払い" checked={amenities.card_payment} onChange={v => setAmenities(a => ({ ...a, card_payment: v }))} />
              <AmenityToggle icon="📶" label="Wi-Fi" checked={amenities.wifi} onChange={v => setAmenities(a => ({ ...a, wifi: v }))} />
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

      {/* Product Manager */}
      <div className="p-5 border-b border-gray-100">
        <ProductManager shopId={shop.id} />
      </div>

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
