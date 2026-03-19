'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Search, Trash2, Eye, EyeOff, Flag, Star,
  BarChart3, Store, MessageSquare, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  checkIsAdmin,
  fetchAdminStats,
  fetchAllShops,
  toggleShopVisibility,
  deleteShop,
  fetchAllReviews,
  deleteReview,
  toggleReviewFlag,
} from '@/lib/supabase/admin-queries'
import type { AdminStats, ReviewWithShop } from '@/lib/supabase/admin-queries'
import type { Shop } from '@/types'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/auth/AuthModal'

type Tab = 'overview' | 'shops' | 'reviews'

// --- Overview Tab ---
function OverviewTab({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  if (loading || !stats) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'ショップ数', value: stats.totalShops, color: 'text-green-700 bg-green-50' },
          { label: 'レビュー数', value: stats.totalReviews, color: 'text-blue-700 bg-blue-50' },
          { label: 'ブックマーク数', value: stats.totalBookmarks, color: 'text-purple-700 bg-purple-50' },
          { label: '非表示ショップ', value: stats.hiddenShops, color: 'text-gray-700 bg-gray-100' },
          { label: 'フラグ付きレビュー', value: stats.flaggedReviews, color: 'text-red-700 bg-red-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
            <p className="text-xs opacity-70">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">都市別ショップ数 (Top 10)</h3>
        <div className="space-y-2">
          {stats.topCities.map(({ city, count }) => (
            <div key={city} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-32 truncate">{city}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(count / stats.topCities[0].count) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-10 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Shops Tab ---
function ShopsTab() {
  const [shops, setShops] = useState<Shop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'hidden' | 'visible'>('all')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await fetchAllShops(page, search, filter)
    setShops(result.shops)
    setTotal(result.total)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput)
  }

  const handleToggle = async (shop: Shop) => {
    const hidden = !(shop as Shop & { is_hidden?: boolean }).is_hidden
    await toggleShopVisibility(shop.id, hidden)
    await load()
  }

  const handleDelete = async (id: string) => {
    await deleteShop(id)
    setConfirmDelete(null)
    await load()
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ショップ名で検索..."
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button type="submit" className="h-9 px-4 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            検索
          </button>
        </form>
        <div className="flex gap-1">
          {(['all', 'visible', 'hidden'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '全て' : f === 'visible' ? '表示中' : '非表示'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">{total.toLocaleString()}件</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : shops.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">該当するショップがありません</p>
      ) : (
        <div className="space-y-2">
          {shops.map(shop => {
            const isHidden = (shop as Shop & { is_hidden?: boolean }).is_hidden
            return (
              <div key={shop.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isHidden ? 'border-gray-300 opacity-60' : 'border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{shop.name}</span>
                    {shop.is_verified && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">認証済</span>}
                    {shop.is_premium && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Premium</span>}
                    {isHidden && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">非表示</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{shop.city} · {new Date(shop.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/shop?id=${shop.id}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    title="ショップページを開く"
                  >
                    <Store className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleToggle(shop)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    title={isHidden ? '表示する' : '非表示にする'}
                  >
                    {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {confirmDelete === shop.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(shop.id)}
                        className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        削除する
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] px-2 py-1 text-gray-500 hover:text-gray-700"
                      >
                        戻す
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(shop.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// --- Reviews Tab ---
function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewWithShop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'flagged'>('all')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await fetchAllReviews(page, filter)
    setReviews(result.reviews)
    setTotal(result.total)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFlag = async (r: ReviewWithShop) => {
    await toggleReviewFlag(r.id, !r.is_flagged)
    await load()
  }

  const handleDelete = async (id: string) => {
    await deleteReview(id)
    setConfirmDelete(null)
    await load()
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'flagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '全て' : 'フラグ付き'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{total.toLocaleString()}件</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">レビューがありません</p>
      ) : (
        <div className="space-y-2">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border p-4 ${r.is_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{r.shop_name}</span>
                    <span className="text-xs text-gray-400">{r.shop_city}</span>
                    {r.is_flagged && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">フラグ</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  {r.body && <p className="text-xs text-gray-600 mt-1">{r.body}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">user: {r.user_id.slice(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleFlag(r)}
                    className={`p-2 rounded-lg hover:bg-gray-50 ${r.is_flagged ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    title={r.is_flagged ? 'フラグを外す' : 'フラグを付ける'}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                  {confirmDelete === r.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        削除
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] px-2 py-1 text-gray-500"
                      >
                        戻す
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// --- Main Dashboard ---
export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const admin = await checkIsAdmin(data.user.id)
        setIsAdmin(admin)
        if (admin) {
          setStatsLoading(true)
          const s = await fetchAdminStats()
          setStats(s)
          setStatsLoading(false)
        }
      }
      setLoading(false)
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
          supabase.auth.getUser().then(async ({ data }) => {
            setUser(data.user)
            if (data.user) {
              const admin = await checkIsAdmin(data.user.id)
              setIsAdmin(admin)
            }
          })
        }} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm mx-4 text-center space-y-3">
          <p className="text-red-600 font-bold">アクセス拒否</p>
          <p className="text-sm text-gray-500">管理者権限がありません。</p>
          <Link href="/" className="inline-block text-sm text-green-600 hover:text-green-700">
            トップへ戻る
          </Link>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概要', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'shops', label: 'ショップ', icon: <Store className="w-4 h-4" /> },
    { key: 'reviews', label: 'レビュー', icon: <MessageSquare className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              トップへ
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-900">管理者ダッシュボード</span>
          </div>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors flex-1 justify-center ${
                tab === t.key ? 'bg-green-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab stats={stats} loading={statsLoading} />}
        {tab === 'shops' && <ShopsTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </div>
    </div>
  )
}
