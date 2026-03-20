'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Trash2, Eye, EyeOff, Store } from 'lucide-react'
import { fetchAllShops, toggleShopVisibility, deleteShop, PAGE_SIZE } from '@/lib/supabase/admin-queries'
import type { AdminShop } from '@/lib/supabase/admin-queries'
import Pagination from './Pagination'

type Filter = 'all' | 'hidden' | 'visible'
const FILTER_LABELS: Record<Filter, string> = { all: '全て', visible: '表示中', hidden: '非表示' }

export default function ShopsTab() {
  const [shops, setShops] = useState<AdminShop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async (p: number, s: string, f: Filter) => {
    setLoading(true)
    const r = await fetchAllShops(p, s, f)
    setShops(r.shops)
    setTotal(r.total)
    setLoading(false)
  }, [])

  useEffect(() => { load(page, search, filter) }, [page, search, filter, load])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(0); setSearch(input) }

  const handleToggle = useCallback(async (shop: AdminShop) => {
    await toggleShopVisibility(shop.id, !shop.is_hidden)
    load(page, search, filter)
  }, [page, search, filter, load])

  const handleDelete = useCallback(async (id: string) => {
    await deleteShop(id)
    setDeleting(null)
    load(page, search, filter)
  }, [page, search, filter, load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="ショップ名で検索..."
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="h-9 px-4 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">検索</button>
        </form>
        <div className="flex gap-1">
          {(['all', 'visible', 'hidden'] as Filter[]).map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">{total.toLocaleString()}件</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : shops.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">該当なし</p>
      ) : (
        <div className="space-y-1.5">
          {shops.map(shop => (
            <div key={shop.id} className={`bg-white rounded-lg border px-4 py-3 flex items-center gap-4 ${shop.is_hidden ? 'border-gray-300 opacity-60' : 'border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">{shop.name}</span>
                  {shop.is_verified && <span className="text-[10px] px-1.5 bg-blue-100 text-blue-700 rounded">認証済</span>}
                  {shop.is_premium && <span className="text-[10px] px-1.5 bg-yellow-100 text-yellow-700 rounded">Premium</span>}
                  {shop.is_hidden && <span className="text-[10px] px-1.5 bg-gray-200 text-gray-600 rounded">非表示</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{shop.city} · {new Date(shop.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/shop?id=${shop.id}`} target="_blank" className="p-2 text-gray-400 hover:text-gray-600" title="表示">
                  <Store className="w-4 h-4" />
                </Link>
                <button onClick={() => handleToggle(shop)} className="p-2 text-gray-400 hover:text-gray-600" title={shop.is_hidden ? '表示' : '非表示'}>
                  {shop.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {deleting === shop.id ? (
                  <>
                    <button onClick={() => handleDelete(shop.id)} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded">削除</button>
                    <button onClick={() => setDeleting(null)} className="text-[10px] px-2 py-1 text-gray-500">戻す</button>
                  </>
                ) : (
                  <button onClick={() => setDeleting(shop.id)} className="p-2 text-gray-400 hover:text-red-500" title="削除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={totalPages} onPage={setPage} />
    </div>
  )
}
