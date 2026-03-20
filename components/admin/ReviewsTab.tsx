'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Flag, Star } from 'lucide-react'
import { fetchAllReviews, deleteReview, toggleReviewFlag, PAGE_SIZE } from '@/lib/supabase/admin-queries'
import type { ReviewWithShop } from '@/lib/supabase/admin-queries'
import Pagination from './Pagination'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  )
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewWithShop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'flagged'>('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async (p: number, f: 'all' | 'flagged') => {
    setLoading(true)
    const r = await fetchAllReviews(p, f)
    setReviews(r.reviews)
    setTotal(r.total)
    setLoading(false)
  }, [])

  useEffect(() => { load(page, filter) }, [page, filter, load])

  const handleFlag = useCallback(async (r: ReviewWithShop) => {
    await toggleReviewFlag(r.id, !r.is_flagged)
    load(page, filter)
  }, [page, filter, load])

  const handleDelete = useCallback(async (id: string) => {
    await deleteReview(id)
    setDeleting(null)
    load(page, filter)
  }, [page, filter, load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'flagged'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? '全て' : 'フラグ付き'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{total.toLocaleString()}件</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">該当なし</p>
      ) : (
        <div className="space-y-1.5">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white rounded-lg border px-4 py-3 flex items-start gap-3 ${r.is_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{r.shop_name}</span>
                  <span className="text-xs text-gray-400">{r.shop_city}</span>
                  {r.is_flagged && <span className="text-[10px] px-1.5 bg-red-100 text-red-700 rounded">フラグ</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                  <span className="text-[10px] text-gray-300">({r.user_id.slice(0, 8)})</span>
                </div>
                {r.body && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.body}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleFlag(r)}
                  className={`p-2 rounded-lg hover:bg-gray-50 ${r.is_flagged ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} title="フラグ">
                  <Flag className="w-4 h-4" />
                </button>
                {deleting === r.id ? (
                  <>
                    <button onClick={() => handleDelete(r.id)} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded">削除</button>
                    <button onClick={() => setDeleting(null)} className="text-[10px] px-2 py-1 text-gray-500">戻す</button>
                  </>
                ) : (
                  <button onClick={() => setDeleting(r.id)} className="p-2 text-gray-400 hover:text-red-500" title="削除">
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
